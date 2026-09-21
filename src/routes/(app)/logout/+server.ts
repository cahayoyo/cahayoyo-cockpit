import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { auth } from '$lib/server/auth';
import { applyAuthCookies } from '$lib/server/auth-cookies';
import { clearVaultUnlock } from '$lib/server/vault-unlock';

export const POST: RequestHandler = async (event) => {
	const response = await auth.api.signOut({
		headers: event.request.headers,
		asResponse: true
	});

	applyAuthCookies(event.cookies, response);
	clearVaultUnlock(event.cookies);
	redirect(303, '/login');
};
