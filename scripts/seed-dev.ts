import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { ensureInbox } from '$lib/server/users';

// Dev-only credentials: set them in .env (never committed) — see .env.example.
const seedEnvSchema = z.object({
	SEED_ADMIN_EMAIL: z.string().trim().pipe(z.email()),
	SEED_ADMIN_PASSWORD: z.string().min(12, 'SEED_ADMIN_PASSWORD must be at least 12 characters'),
	SEED_TEST_EMAIL: z.string().trim().pipe(z.email()),
	SEED_TEST_PASSWORD: z.string().min(12, 'SEED_TEST_PASSWORD must be at least 12 characters')
});

// Fail-closed allowlist of known dev hosts. Extend it here when the dev
// database moves; anything unrecognized is refused.
const DEV_DB_HOSTS = [/^localhost$/, /^127\.0\.0\.1$/, /\.neon\.tech$/];

// The test account must never exist in production (CONSTITUTION v2.0.0: test
// accounts are seeded only in dev databases).
function assertDevDatabase(): void {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('Refusing to seed: NODE_ENV=production.');
	}
	let host: string;
	try {
		host = new URL(process.env.DATABASE_URL ?? '').hostname;
	} catch {
		throw new Error('Refusing to seed: DATABASE_URL is missing or not a valid URL.');
	}
	if (!DEV_DB_HOSTS.some((pattern) => pattern.test(host))) {
		throw new Error(
			`Refusing to seed: DATABASE_URL host "${host}" is not in the dev allowlist ` +
				'(DEV_DB_HOSTS in scripts/seed-dev.ts). Extend it only for a real dev database.'
		);
	}
}

assertDevDatabase();
const env = seedEnvSchema.parse(process.env);
const ctx = await auth.$context;

async function createCredentialAccount(userId: string, passwordHash: string): Promise<void> {
	await ctx.internalAdapter.createAccount({
		userId,
		accountId: userId,
		providerId: 'credential',
		password: passwordHash
	});
}

async function upsertSeedUser(
	email: string,
	password: string,
	name: string
): Promise<{ id: string; action: 'created' | 'updated' }> {
	const existing = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: true });
	const passwordHash = await ctx.password.hash(password);

	if (!existing) {
		const user = await ctx.internalAdapter.createUser(
			{ email, name, emailVerified: true },
			{ method: 'email-password' }
		);
		await createCredentialAccount(user.id, passwordHash);
		return { id: user.id, action: 'created' };
	}

	await ctx.internalAdapter.updateUser(existing.user.id, { name, emailVerified: true });
	const credentialAccount = existing.accounts.find(
		(account) => account.providerId === 'credential'
	);
	if (credentialAccount) {
		await ctx.internalAdapter.updateAccount(credentialAccount.id, { password: passwordHash });
	} else {
		await createCredentialAccount(existing.user.id, passwordHash);
	}
	return { id: existing.user.id, action: 'updated' };
}

// Roles are written through the schema directly so re-seeding stays idempotent;
// the admin plugin equivalent (auth.api.createUser) would run the full
// account-creation flow on every seed.
async function setRole(userId: string, role: 'admin' | 'user'): Promise<void> {
	await db.update(user).set({ role }).where(eq(user.id, userId));
}

const admin = await upsertSeedUser(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD, 'Admin');
await setRole(admin.id, 'admin');
await ensureInbox(admin.id);

const test = await upsertSeedUser(env.SEED_TEST_EMAIL, env.SEED_TEST_PASSWORD, 'Test User');
await setRole(test.id, 'user');
await ensureInbox(test.id);

console.log(`seeded: admin account ${admin.action}, test account ${test.action}.`);
