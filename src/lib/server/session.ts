import { error } from '@sveltejs/kit';

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
