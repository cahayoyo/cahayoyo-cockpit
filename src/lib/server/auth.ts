import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		// The drizzle instance is created without a schema, so the auth tables are
		// passed explicitly. Drizzle keeps the camelCase property names Better Auth
		// expects while the DB columns stay snake_case (see schema.ts).
		schema: { user, session, account, verification }
	}),
	advanced: {
		// Explicit UUID generator: the literal "uuid" mode expects a database
		// default on the PK columns, and the auth tables use plain text PKs.
		database: { generateId: () => crypto.randomUUID() }
	},
	emailAndPassword: {
		enabled: true,
		disableSignUp: true
	}
});
