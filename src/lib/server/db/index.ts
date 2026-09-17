import { drizzle } from 'drizzle-orm/bun-sql';
import { envSchema } from '../env';

// process.env (not $env/dynamic/private) so non-SvelteKit entrypoints like
// scripts/migrate.ts and scripts/seed-dev.ts can import this module (Bun loads .env).
export const db = drizzle(envSchema.parse(process.env).DATABASE_URL);

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
