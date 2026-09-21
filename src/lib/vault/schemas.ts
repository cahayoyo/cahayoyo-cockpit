import { z } from 'zod';
import { parseTags } from '$lib/tags';
import { VAULT_TYPES } from './types';

// Client-safe: the editor dialog and the server actions share one schema.
// Optional text fields come in as strings and are stored as NULL when blank.
// The secret field holds the encrypted-note body for `note` entries.
export const vaultFormSchema = z
	.object({
		title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.'),
		type: z.enum(VAULT_TYPES),
		username: z.string().trim().max(200, 'Username is too long.'),
		secret: z.string().min(1, 'Secret is required.').max(5000, 'Secret is too long.'),
		url: z.string().trim().max(500, 'URL is too long.'),
		notes: z.string().trim().max(5000, 'Notes are too long.'),
		tags: z.string().transform(parseTags)
	})
	.refine((input) => input.type !== 'login' || input.username.length > 0, {
		message: 'Username is required for logins.',
		path: ['username']
	});

export type VaultFormInput = z.infer<typeof vaultFormSchema>;
