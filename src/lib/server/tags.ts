import { asc, inArray } from 'drizzle-orm';
import type { Transaction } from './db';
import { db } from './db';
import { tag } from './db/schema';

export async function listTags(): Promise<string[]> {
	const rows = await db.select({ name: tag.name }).from(tag).orderBy(asc(tag.name));
	return rows.map((row) => row.name);
}

/**
 * Resolves tag names to tag ids, creating the missing rows. Callers insert the
 * ids into their own link table inside the same transaction.
 */
export async function ensureTagIds(tx: Transaction, names: readonly string[]): Promise<string[]> {
	if (names.length === 0) {
		return [];
	}

	for (const name of names) {
		await tx.insert(tag).values({ name }).onConflictDoNothing({ target: tag.name });
	}

	const rows = await tx
		.select({ id: tag.id })
		.from(tag)
		.where(inArray(tag.name, [...names]));

	return rows.map((row) => row.id);
}
