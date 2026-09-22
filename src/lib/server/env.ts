import { z } from 'zod';

const VAULT_KEY_BYTES = 32;

// Kept alias-free so drizzle-kit can load it outside SvelteKit (see drizzle.config.ts).
export const envSchema = z.object({
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
	BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
	// AES-256-GCM key: base64 for exactly 32 bytes (`openssl rand -base64 32`).
	// Fail-fast at boot: a changed key makes existing vault entries unreadable.
	VAULT_ENCRYPTION_KEY: z
		.string()
		.refine((value) => Buffer.from(value, 'base64').length === VAULT_KEY_BYTES, {
			message: 'VAULT_ENCRYPTION_KEY must be base64 for exactly 32 bytes'
		}),
	// Cloudflare R2 media storage (private bucket, served through /media/[id]).
	R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
	R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
	R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
	R2_BUCKET: z.string().min(1, 'R2_BUCKET is required')
});
