import { drizzle } from 'drizzle-orm/bun-sql';
import { migrate } from 'drizzle-orm/bun-sql/migrator';
// Relative import on purpose: this script runs outside SvelteKit, where the
// `$lib` alias is not resolvable.
import { envSchema } from '../src/lib/server/env';

// drizzle-kit migrate has no bun-sql driver, so migrations run through the
// app's own driver (Bun auto-loads .env).
const db = drizzle(envSchema.parse(process.env).DATABASE_URL);

await migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations applied.');
