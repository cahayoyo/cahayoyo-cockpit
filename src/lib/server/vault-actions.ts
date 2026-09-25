import { fail, type RequestEvent } from '@sveltejs/kit';
import { dbIdSchema } from '$lib/ids';
import { vaultFormSchema } from '$lib/vault/schemas';
import { auth } from './auth';
import { requiredId, text } from './form-data';
import { requireUserId } from './session';
import { createEntry, deleteEntry, revealEntry, updateEntry } from './vault';
import { clearVaultUnlock, isVaultUnlocked, issueVaultUnlock } from './vault-unlock';

const LOCKED = 'Vault is locked.';
const INVALID = 'Invalid entry.';

// Vault form actions: one implementation for the vault page — the vaultActions
// counterpart of taskActions/folderActions/emailActions.
export const vaultActions = {
	unlockVault: async ({ request, cookies }: RequestEvent) => {
		const password = text(await request.formData(), 'password');

		// No rate limiting on password attempts in v1 (grill decision 18): a single
		// user behind an authenticated session. Revisit if that ever changes.
		try {
			await auth.api.verifyPassword({ body: { password }, headers: request.headers });
		} catch {
			return fail(401, { message: 'Incorrect password.' });
		}

		issueVaultUnlock(cookies);
		return { unlocked: true };
	},

	lockVault: async ({ cookies }: RequestEvent) => {
		clearVaultUnlock(cookies);
		return { locked: true };
	},

	saveEntry: async ({ request, cookies, locals }: RequestEvent) => {
		// Create and edit put plaintext into a form, so they are gated too.
		if (!isVaultUnlocked(cookies)) {
			return fail(401, { message: LOCKED });
		}

		const formData = await request.formData();
		const parsed = vaultFormSchema.safeParse({
			title: text(formData, 'title'),
			type: text(formData, 'type'),
			username: text(formData, 'username'),
			secret: text(formData, 'secret'),
			url: text(formData, 'url'),
			notes: text(formData, 'notes'),
			tags: text(formData, 'tags')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? INVALID });
		}

		const ownerId = requireUserId(locals);

		// No id: the dialog is creating; otherwise it edits that record.
		const id = text(formData, 'id');
		if (id === '') {
			const created = await createEntry(ownerId, parsed.data);
			if (!created.ok) {
				return fail(400, { message: created.error });
			}

			issueVaultUnlock(cookies);
			return { entryId: created.id };
		}

		const parsedId = dbIdSchema.safeParse(id);
		if (!parsedId.success) {
			return fail(400, { message: INVALID });
		}

		const updated = await updateEntry(ownerId, parsedId.data, parsed.data);
		if (!updated.ok) {
			return fail(400, { message: updated.error });
		}

		issueVaultUnlock(cookies);
		return { saved: true, entryId: parsedId.data };
	},

	deleteEntry: async ({ request }: RequestEvent) => {
		// Ungated on purpose (grill decision 2): deleting ciphertext never shows plaintext.
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: INVALID });
		}

		await deleteEntry(id);
		return { deleted: true };
	},

	revealEntry: async ({ request, cookies }: RequestEvent) => {
		if (!isVaultUnlocked(cookies)) {
			return fail(401, { message: LOCKED });
		}

		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: INVALID });
		}

		const revealed = await revealEntry(id);
		if (!revealed.ok) {
			return fail(revealed.reason === 'missing' ? 404 : 400, { message: revealed.error });
		}

		issueVaultUnlock(cookies);
		return { secret: revealed.secret, notes: revealed.notes };
	}
};
