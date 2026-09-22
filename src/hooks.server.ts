import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from '$lib/server/auth';
import { isPublicPath } from '$lib/server/auth-paths';

export const handle: Handle = async ({ event, resolve }) => {
	if (!building && !isPublicPath(event.url.pathname)) {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (!session) {
			redirect(302, '/login');
		}

		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
