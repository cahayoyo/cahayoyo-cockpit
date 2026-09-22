import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { auth } from '$lib/server/auth';
import { applyAuthCookies } from '$lib/server/auth-cookies';

// Generic message on purpose: never reveal whether the email exists or the
// password was wrong (CODE_STANDARDS §5).
const INVALID_MESSAGE = 'Invalid email or password.';

const loginSchema = z.object({
	email: z.string().trim().pipe(z.email()),
	password: z.string().min(1)
});

export const actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: INVALID_MESSAGE });
		}

		let response: Response;
		try {
			response = await auth.api.signInEmail({
				body: parsed.data,
				headers: event.request.headers,
				asResponse: true
			});
		} catch (error) {
			console.error('Sign-in failed:', error instanceof Error ? error.message : error);
			return fail(500, { error: 'Sign-in failed. Try again.' });
		}

		if (!response.ok) {
			return fail(400, { error: INVALID_MESSAGE });
		}

		applyAuthCookies(event.cookies, response);
		redirect(303, '/');
	}
};
