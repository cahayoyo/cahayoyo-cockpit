import { fail, type RequestEvent } from '@sveltejs/kit';
import { changePasswordSchema } from './account-schemas';
import { auth } from './auth';
import { applyAuthCookies } from './auth-cookies';
import { text } from './form-data';
import { requireUserId } from './session';

// Self-service auth actions, shaped like taskActions / folderActions — the
// settings route (#88) spreads this object into its actions.
export const authActions = {
	changePassword: async ({ request, cookies, locals }: RequestEvent) => {
		requireUserId(locals);
		const formData = await request.formData();
		const parsed = changePasswordSchema.safeParse({
			currentPassword: text(formData, 'currentPassword'),
			newPassword: text(formData, 'newPassword')
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid password.' });
		}

		// asResponse: revoking the other sessions replaces this session too, so
		// the fresh session cookie comes back on the response and is forwarded.
		const response = await auth.api.changePassword({
			body: { ...parsed.data, revokeOtherSessions: true },
			headers: request.headers,
			asResponse: true
		});

		if (!response.ok) {
			// A 400 here is the wrong current password: the new password already
			// passed the same 8-character floor Better Auth enforces.
			if (response.status === 400) {
				return fail(400, {
					field: 'currentPassword',
					message: 'Your current password is incorrect.'
				});
			}

			return fail(response.status, { message: 'Could not change the password. Try again.' });
		}

		applyAuthCookies(cookies, response);
		return { changed: true };
	}
};
