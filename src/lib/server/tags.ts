import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Transaction } from './db';
import { db } from './db';
import { tag, tagKind } from './db/schema';

export type TagKind = (typeof tagKind.enumValues)[number];

export async function listTags(ownerId: string, kind: TagKind): Promise<string[]> {
	const rows = await db
		.select({ name: tag.name })
		.from(tag)
		.where(and(eq(tag.ownerId, ownerId), eq(tag.kind, kind)))
		.orderBy(asc(tag.name));

	return rows.map((row) => row.name);
}

/**
 * Resolves tag names to the owner's tag ids within one module's namespace,
 * creating the missing rows. Callers insert the ids into their own link table
 * inside the same transaction.
 */
export async function ensureTagIds(
	tx: Transaction,
	ownerId: string,
	kind: TagKind,
	names: readonly string[]
): Promise<string[]> {
	if (names.length === 0) {
		return [];
	}

	for (const name of names) {
		await tx
			.insert(tag)
			.values({ name, ownerId, kind })
			.onConflictDoNothing({ target: [tag.ownerId, tag.kind, tag.name] });
	}

	const rows = await tx
		.select({ id: tag.id })
		.from(tag)
		.where(and(eq(tag.ownerId, ownerId), eq(tag.kind, kind), inArray(tag.name, [...names])));

	return rows.map((row) => row.id);
}
