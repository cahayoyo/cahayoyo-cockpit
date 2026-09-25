import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Transaction } from './db';
import { db } from './db';
import { tag } from './db/schema';

export async function listTags(): Promise<string[]> {
	const rows = await db.select({ name: tag.name }).from(tag).orderBy(asc(tag.name));
	return rows.map((row) => row.name);
}

/**
 * Resolves tag names to the owner's tag ids, creating the missing rows. Callers
 * insert the ids into their own link table inside the same transaction.
 */
export async function ensureTagIds(
	tx: Transaction,
	ownerId: string,
	names: readonly string[]
): Promise<string[]> {
	if (names.length === 0) {
		return [];
	}

	for (const name of names) {
		await tx
			.insert(tag)
			.values({ name, ownerId })
			.onConflictDoNothing({ target: [tag.ownerId, tag.name] });
	}

	const rows = await tx
		.select({ id: tag.id })
		.from(tag)
		.where(and(eq(tag.ownerId, ownerId), inArray(tag.name, [...names])));

	return rows.map((row) => row.id);
}
