import { userAdminActions } from '$lib/server/user-actions';
import { listUsers } from '$lib/server/users';
import type { Actions, PageServerLoad } from './$types.js';

// Super-admin account management (#89). `listUsers` enforces the role
// server-side (403), so a direct visit by any other account is refused rather
// than only hidden from the nav.
export const load: PageServerLoad = async (event) => {
	return { users: await listUsers(event) };
};

export const actions: Actions = { ...userAdminActions };
