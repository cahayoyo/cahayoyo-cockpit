import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';

// One-shot tenancy backfill (spec §4). Run BETWEEN migrations 0005 (nullable
// owner_id) and 0006 (owner_id NOT NULL). Idempotent: rows already owned by the
// target are left alone, and rows owned by anyone else abort the whole run.
//
// Usage: bun scripts/backfill-owner.ts <email>   (dev first; production needs
// the owner's explicit approval — dev and prod share one Neon database.)

// Fixed id seeded by migration 0001. Kept here, not in src/lib/ids.ts: the
// inbox id is no longer a runtime constant after tenancy.
const SEEDED_INBOX_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

const OWNED_TABLES = [
	'media',
	'folder',
	'bookmark',
	'note',
	'project',
	'task',
	'disposable_email',
	'vault_entry',
	'tag'
] as const;

const parsedEmail = z.string().trim().pipe(z.email()).safeParse(process.argv[2]);
if (!parsedEmail.success) {
	console.error('Usage: bun scripts/backfill-owner.ts <email>');
	process.exit(1);
}
const email = parsedEmail.data;

const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
if (!owner) {
	throw new Error(`Refusing to backfill: no account with email "${email}".`);
}

await db.transaction(async (tx) => {
	for (const table of OWNED_TABLES) {
		const conflicts = await tx.execute<{ n: number }>(sql`
			SELECT count(*)::int AS n FROM ${sql.identifier(table)}
			WHERE owner_id IS NOT NULL AND owner_id <> ${owner.id}
		`);
		const ownedByOthers = conflicts[0]?.n ?? 0;
		if (ownedByOthers > 0) {
			throw new Error(
				`Refusing to backfill: "${table}" already has ${ownedByOthers} row(s) owned by another account.`
			);
		}
	}

	for (const table of OWNED_TABLES) {
		const updated = await tx.execute<{ id: string }>(sql`
			UPDATE ${sql.identifier(table)} SET owner_id = ${owner.id}
			WHERE owner_id IS NULL RETURNING id
		`);
		console.log(`${table}: ${updated.length} row(s) assigned to ${email}.`);
	}

	const inbox = await tx.execute<{ id: string }>(sql`
		UPDATE "project" SET is_inbox = true
		WHERE id = ${SEEDED_INBOX_PROJECT_ID} RETURNING id
	`);
	if (inbox.length === 0) {
		throw new Error('Refusing to backfill: the seeded Inbox project is missing.');
	}

	// The target account is the super admin by definition; no other code path
	// can promote it before the admin pages exist.
	const promoted = await tx.execute<{ id: string }>(sql`
		UPDATE "user" SET role = 'admin' WHERE id = ${owner.id} AND role <> 'admin' RETURNING id
	`);
	console.log(
		promoted.length > 0 ? `${email} promoted to role "admin".` : `${email} is already role "admin".`
	);

	console.log(`Inbox project ${SEEDED_INBOX_PROJECT_ID} marked as ${email}'s Inbox.`);
});

console.log('Backfill complete.');
