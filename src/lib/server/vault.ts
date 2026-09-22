import { asc, desc, eq, inArray } from 'drizzle-orm';
import { groupTagNames } from '$lib/tags';
import type { VaultFormInput } from '$lib/vault/schemas';
import type { VaultEntryItem } from '$lib/vault/types';
import type { Transaction } from './db';
import { db } from './db';
import { tag, vaultEntry, vaultEntryTag } from './db/schema';
import { envSchema } from './env';
import { ensureTagIds } from './tags';
import { decryptSecret, encryptSecret } from './vault-crypto';

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
export type WriteResult = { ok: true } | { ok: false; error: string };

export type RevealResult =
	| { ok: true; secret: string; notes: string | null }
	| { ok: false; reason: 'missing' | 'undecryptable'; error: string };

// Decoded once at boot; a missing or malformed key fails fast (env.ts).
const vaultKey = Buffer.from(envSchema.parse(process.env).VAULT_ENCRYPTION_KEY, 'base64');

/** Every entry's metadata plus its tag names — never the encrypted columns. */
export async function listVaultEntries(): Promise<VaultEntryItem[]> {
	const rows = await db
		.select({
			id: vaultEntry.id,
			title: vaultEntry.title,
			type: vaultEntry.type,
			username: vaultEntry.username,
			url: vaultEntry.url,
			updatedAt: vaultEntry.updatedAt
		})
		.from(vaultEntry)
		.orderBy(desc(vaultEntry.updatedAt));

	if (rows.length === 0) {
		return [];
	}

	const links = await db
		.select({ id: vaultEntryTag.vaultEntryId, name: tag.name })
		.from(vaultEntryTag)
		.innerJoin(tag, eq(vaultEntryTag.tagId, tag.id))
		.where(
			inArray(
				vaultEntryTag.vaultEntryId,
				rows.map((row) => row.id)
			)
		)
		.orderBy(asc(tag.name));

	const tagsByEntry = groupTagNames(links);

	return rows.map((row) => ({ ...row, tags: tagsByEntry.get(row.id) ?? [] }));
}

async function attachTags(tx: Transaction, entryId: string, names: string[]): Promise<void> {
	const tagIds = await ensureTagIds(tx, names);
	if (tagIds.length === 0) {
		return;
	}

	await tx.insert(vaultEntryTag).values(tagIds.map((tagId) => ({ vaultEntryId: entryId, tagId })));
}

// `secret_value` and `notes` are encrypted at rest; `notes` stays NULL when blank.
function entryValues(input: VaultFormInput, key: Buffer) {
	return {
		title: input.title,
		type: input.type,
		username: input.username || null,
		secretValue: encryptSecret(input.secret, key),
		url: input.url || null,
		notes: input.notes ? encryptSecret(input.notes, key) : null
	};
}

export async function createEntry(input: VaultFormInput): Promise<CreateResult> {
	const key = vaultKey;

	return db.transaction(async (tx) => {
		const [row] = await tx
			.insert(vaultEntry)
			.values(entryValues(input, key))
			.returning({ id: vaultEntry.id });

		await attachTags(tx, row.id, input.tags);
		return { ok: true, id: row.id };
	});
}

export async function updateEntry(id: string, input: VaultFormInput): Promise<WriteResult> {
	const key = vaultKey;

	return db.transaction(async (tx) => {
		const updated = await tx
			.update(vaultEntry)
			.set(entryValues(input, key))
			.where(eq(vaultEntry.id, id))
			.returning({ id: vaultEntry.id });

		if (updated.length === 0) {
			return { ok: false, error: 'This entry no longer exists.' };
		}

		await tx.delete(vaultEntryTag).where(eq(vaultEntryTag.vaultEntryId, id));
		await attachTags(tx, id, input.tags);
		return { ok: true };
	});
}

export async function deleteEntry(id: string): Promise<void> {
	// vault_entry_tag rows go with the entry via ON DELETE CASCADE.
	await db.delete(vaultEntry).where(eq(vaultEntry.id, id));
}

/**
 * Decrypts on demand: the only path that reads plaintext. A missing row and an
 * undecryptable payload are distinguishable, and neither leaks key material.
 */
export async function revealEntry(id: string): Promise<RevealResult> {
	const [row] = await db
		.select({ secretValue: vaultEntry.secretValue, notes: vaultEntry.notes })
		.from(vaultEntry)
		.where(eq(vaultEntry.id, id));

	if (!row) {
		return { ok: false, reason: 'missing', error: 'This entry no longer exists.' };
	}

	const key = vaultKey;
	const secret = decryptSecret(row.secretValue, key);
	if (!secret.ok) {
		return { ok: false, reason: 'undecryptable', error: secret.error };
	}

	let notes: string | null = null;
	if (row.notes !== null) {
		const decrypted = decryptSecret(row.notes, key);
		if (!decrypted.ok) {
			return { ok: false, reason: 'undecryptable', error: decrypted.error };
		}
		notes = decrypted.value;
	}

	return { ok: true, secret: secret.value, notes };
}
