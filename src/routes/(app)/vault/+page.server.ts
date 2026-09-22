import { listTags } from '$lib/server/tags';
import { listVaultEntries } from '$lib/server/vault';
import { vaultActions } from '$lib/server/vault-actions';
import { isVaultUnlocked } from '$lib/server/vault-unlock';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ cookies }) => {
	// Metadata + tag names only; plaintext never reaches the SSR payload (the
	// reveal endpoint owns it). The unlock chip reads the signed cookie. Filters
	// stay client-side: the page derives them from the URL.
	return {
		entries: await listVaultEntries(),
		tags: await listTags(),
		unlocked: isVaultUnlocked(cookies)
	};
};

export const actions: Actions = { ...vaultActions };
