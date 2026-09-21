import { listTags } from '$lib/server/tags';
import { listVaultEntries } from '$lib/server/vault';
import { vaultActions } from '$lib/server/vault-actions';
import { isVaultUnlocked } from '$lib/server/vault-unlock';
import { parseVaultSearch } from '$lib/vault/params';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Metadata + tag names only; plaintext never reaches the SSR payload (the
	// reveal endpoint owns it). The unlock chip reads the signed cookie.
	return {
		filters: parseVaultSearch(url.searchParams),
		entries: await listVaultEntries(),
		tags: await listTags(),
		unlocked: isVaultUnlocked(cookies)
	};
};

export const actions: Actions = { ...vaultActions };
