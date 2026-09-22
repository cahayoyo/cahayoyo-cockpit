import { z } from 'zod';
import { dbIdSchema } from '$lib/ids';
import { EMAIL_STATUSES } from './types';

// Client-safe: the editor dialog and the server actions share one schema.
// Optional text fields come in as strings and are stored as NULL when blank.
export const emailFormSchema = z.object({
	address: z.string().trim().min(1, 'Address is required.').max(320, 'Address is too long.'),
	provider: z.string().trim().max(100, 'Provider is too long.'),
	purpose: z.string().trim().max(200, 'Purpose is too long.'),
	taskId: dbIdSchema.nullable(),
	status: z.enum(EMAIL_STATUSES),
	notes: z.string().trim().max(2000, 'Notes are too long.')
});

export const emailStatusSchema = z.enum(EMAIL_STATUSES);

export type EmailFormInput = z.infer<typeof emailFormSchema>;
