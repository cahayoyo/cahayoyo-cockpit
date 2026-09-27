import { and, asc, eq, inArray } from 'drizzle-orm';
import type { BookmarkFormInput } from '$lib/bookmarks/schemas';
import { groupTagNames } from '$lib/tags';
import type { Transaction } from './db';
import { db } from './db';
import { bookmark, bookmarkTag, tag } from './db/schema';
import { ensureTagIds } from './tags';

export type BookmarkListItem = typeof bookmark.$inferSelect & { tags: string[] };

export async function listBookmarks(ownerId: string): Promise<BookmarkListItem[]> {
	const rows = await db
		.select()
		.from(bookmark)
		.where(eq(bookmark.ownerId, ownerId))
		.orderBy(asc(bookmark.createdAt));

	if (rows.length === 0) {
		return [];
	}

	const links = await db
		.select({ id: bookmarkTag.bookmarkId, name: tag.name })
		.from(bookmarkTag)
		.innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
		.where(
			inArray(
				bookmarkTag.bookmarkId,
				rows.map((row) => row.id)
			)
		)
		.orderBy(asc(tag.name));

	const tagsByBookmark = groupTagNames(links);

	return rows.map((row) => ({ ...row, tags: tagsByBookmark.get(row.id) ?? [] }));
}

async function attachTags(
	tx: Transaction,
	ownerId: string,
	bookmarkId: string,
	names: string[]
): Promise<void> {
	const tagIds = await ensureTagIds(tx, ownerId, names);
	if (tagIds.length === 0) {
		return;
	}

	await tx.insert(bookmarkTag).values(tagIds.map((tagId) => ({ bookmarkId, tagId })));
}

function bookmarkValues(input: BookmarkFormInput) {
	return {
		title: input.title,
		url: input.url,
		description: input.description || null,
		favorite: input.favorite,
		folderId: input.folderId,
		imageId: input.imageId
	};
}

export async function createBookmark(ownerId: string, input: BookmarkFormInput): Promise<string> {
	return db.transaction(async (tx) => {
		const [row] = await tx
			.insert(bookmark)
			.values({ ...bookmarkValues(input), ownerId })
			.returning({ id: bookmark.id });

		await attachTags(tx, ownerId, row.id, input.tags);
		return row.id;
	});
}

export async function updateBookmark(
	ownerId: string,
	id: string,
	input: BookmarkFormInput
): Promise<boolean> {
	return db.transaction(async (tx) => {
		const updated = await tx
			.update(bookmark)
			.set(bookmarkValues(input))
			.where(and(eq(bookmark.id, id), eq(bookmark.ownerId, ownerId)))
			.returning({ id: bookmark.id });

		if (updated.length === 0) {
			return false;
		}

		await tx.delete(bookmarkTag).where(eq(bookmarkTag.bookmarkId, id));
		await attachTags(tx, ownerId, id, input.tags);
		return true;
	});
}

export async function deleteBookmark(ownerId: string, id: string): Promise<boolean> {
	const [deleted] = await db
		.delete(bookmark)
		.where(and(eq(bookmark.id, id), eq(bookmark.ownerId, ownerId)))
		.returning({ id: bookmark.id });

	return deleted !== undefined;
}

export async function setBookmarkFavorite(
	ownerId: string,
	id: string,
	favorite: boolean
): Promise<boolean> {
	const [updated] = await db
		.update(bookmark)
		.set({ favorite })
		.where(and(eq(bookmark.id, id), eq(bookmark.ownerId, ownerId)))
		.returning({ id: bookmark.id });

	return updated !== undefined;
}
