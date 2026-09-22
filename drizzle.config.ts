import { defineConfig } from 'drizzle-kit';
import { envSchema } from './src/lib/server/env';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		url: envSchema.parse(process.env).DATABASE_URL
	}
});
