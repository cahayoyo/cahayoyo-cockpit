import { fail, type RequestEvent } from '@sveltejs/kit';
import { changePasswordSchema } from './account-schemas';
import { auth } from './auth';
import { applyAuthCookies } from './auth-cookies';
import { text } from './form-data';
import { passwordChangeFailure } from './password-change';
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
			const issue = parsed.error.issues[0];
			const field = issue?.path[0] === 'currentPassword' ? 'currentPassword' : 'newPassword';
			return fail(400, { field, message: issue?.message ?? 'Invalid password.' });
		}

		// asResponse: revoking the other sessions replaces this session too, so
		// the fresh session cookie comes back on the response and is forwarded.
		const response = await auth.api.changePassword({
			body: { ...parsed.data, revokeOtherSessions: true },
			headers: request.headers,
			asResponse: true
		});

		if (!response.ok) {
			// Better Auth serializes API errors as `{ code, message }`; only the
			// wrong-current-password code becomes a field error.
			const body = (await response.json().catch(() => null)) as { code?: string } | null;
			return fail(response.status, passwordChangeFailure(body?.code));
		}

		applyAuthCookies(cookies, response);
		return { changed: true };
	}
};
