import { error } from '@sveltejs/kit';
import { ADMIN_ROLE } from '$lib/roles';

/**
 * The signed-in account's id. `hooks.server.ts` fences every app route behind a
 * session, so a missing user here is a wiring bug, not a user-facing state.
 */
export function requireUserId(locals: App.Locals): string {
	const id = locals.user?.id;
	if (!id) {
		error(401, 'Not signed in.');
	}

	return id;
}

/**
 * The super admin's id. The role is read from `locals.user` — the database
 * session set by `hooks.server.ts` — never from request input. A non-admin
 * caller gets 403 before any state change.
 */
export function requireAdmin(locals: App.Locals): string {
	const id = requireUserId(locals);
	if (locals.user?.role !== ADMIN_ROLE) {
		error(403, 'Super admin only.');
	}

	return id;
}
