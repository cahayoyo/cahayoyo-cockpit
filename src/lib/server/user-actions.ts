import { fail, type RequestEvent } from '@sveltejs/kit';
import { isAPIError } from 'better-auth/api';
import { createUserSchema, resetUserPasswordSchema, setUserActiveSchema } from './account-schemas';
import { text } from './form-data';
import { createUser, listUsers, resetUserPassword, setUserActive } from './users';

// Expected auth failures become form failures with curated messages; the raw
// Better Auth detail only reaches the server log (CODE_STANDARDS §5).
function failFromAuthError(error: unknown) {
	if (!isAPIError(error)) {
		throw error;
	}

	console.error('Account action failed:', error.status, error.message);

	if (error.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
		return fail(409, { message: 'An account with that email already exists.' });
	}

	return fail(error.statusCode, { message: 'The account action failed. Try again.' });
}

// Super-admin account management (spec §6): same shape as taskActions /
// folderActions — the users route (#89) spreads this object into its actions.
export const userAdminActions = {
	listUsers: async (event: RequestEvent) => {
		return { users: await listUsers(event) };
	},

	createUser: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const parsed = createUserSchema.safeParse({
			email: text(formData, 'email'),
			name: text(formData, 'name'),
			password: text(formData, 'password')
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid account.' });
		}

		try {
			return { created: true, user: await createUser(event, parsed.data) };
		} catch (error) {
			return failFromAuthError(error);
		}
	},

	setUserActive: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const parsed = setUserActiveSchema.safeParse({
			userId: text(formData, 'userId'),
			active: text(formData, 'active'),
			banReason: text(formData, 'banReason') || undefined
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid account.' });
		}

		try {
			const result = await setUserActive(event, {
				userId: parsed.data.userId,
				active: parsed.data.active === 'true',
				banReason: parsed.data.banReason
			});
			if (!result.ok) {
				return fail(result.reason === 'missing' ? 404 : 400, { message: result.message });
			}

			return { updated: true };
		} catch (error) {
			return failFromAuthError(error);
		}
	},

	resetUserPassword: async (event: RequestEvent) => {
		const formData = await event.request.formData();
		const parsed = resetUserPasswordSchema.safeParse({
			userId: text(formData, 'userId'),
			newPassword: text(formData, 'newPassword')
		});
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid account.' });
		}

		try {
			const result = await resetUserPassword(event, parsed.data);
			if (!result.ok) {
				return fail(result.reason === 'missing' ? 404 : 400, { message: result.message });
			}

			return { reset: true };
		} catch (error) {
			return failFromAuthError(error);
		}
	}
};
