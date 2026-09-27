import { z } from 'zod';
import { dbIdSchema } from '$lib/ids';

// Account lifecycle and password rules (spec §6, §7). The minimum length
// matches Better Auth's default (8) so no path ever hands it a shorter password.
export const PASSWORD_MIN_LENGTH = 8;

const passwordSchema = z
	.string()
	.min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
	.max(128, 'Password is too long.');

export const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Enter your current password.'),
	newPassword: passwordSchema
});

export const createUserSchema = z.object({
	email: z.string().trim().pipe(z.email('Enter a valid email address.')),
	name: z.string().trim().min(1, 'Name is required.').max(100, 'Name is too long.'),
	password: passwordSchema
});

export const setUserActiveSchema = z.object({
	userId: dbIdSchema,
	active: z.enum(['true', 'false']),
	banReason: z.string().trim().max(200, 'Ban reason is too long.').optional()
});

export const resetUserPasswordSchema = z.object({
	userId: dbIdSchema,
	newPassword: passwordSchema
});
