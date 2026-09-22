import { asc, eq } from 'drizzle-orm';
import type { BookmarkFormInput } from '$lib/bookmarks/schemas';
import { groupTagNames } from '$lib/tags';
import type { Transaction } from './db';
import { db } from './db';
import { bookmark, bookmarkTag, tag } from './db/schema';
import { ensureTagIds } from './tags';

export type BookmarkListItem = typeof bookmark.$inferSelect & { tags: string[] };

export async function listBookmarks(): Promise<BookmarkListItem[]> {
	const rows = await db.select().from(bookmark).orderBy(asc(bookmark.createdAt));
	if (rows.length === 0) {
		return [];
	}

	const links = await db
		.select({ id: bookmarkTag.bookmarkId, name: tag.name })
		.from(bookmarkTag)
		.innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
		.orderBy(asc(tag.name));

	const tagsByBookmark = groupTagNames(links);

	return rows.map((row) => ({ ...row, tags: tagsByBookmark.get(row.id) ?? [] }));
}

async function attachTags(tx: Transaction, bookmarkId: string, names: string[]): Promise<void> {
	const tagIds = await ensureTagIds(tx, names);
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

export async function createBookmark(input: BookmarkFormInput): Promise<string> {
	return db.transaction(async (tx) => {
		const [row] = await tx
			.insert(bookmark)
			.values(bookmarkValues(input))
			.returning({ id: bookmark.id });

		await attachTags(tx, row.id, input.tags);
		return row.id;
	});
}

export async function updateBookmark(id: string, input: BookmarkFormInput): Promise<boolean> {
	return db.transaction(async (tx) => {
		const updated = await tx
			.update(bookmark)
			.set(bookmarkValues(input))
			.where(eq(bookmark.id, id))
			.returning({ id: bookmark.id });

		if (updated.length === 0) {
			return false;
		}

		await tx.delete(bookmarkTag).where(eq(bookmarkTag.bookmarkId, id));
		await attachTags(tx, id, input.tags);
		return true;
	});
}

export async function deleteBookmark(id: string): Promise<void> {
	await db.delete(bookmark).where(eq(bookmark.id, id));
}

export async function setBookmarkFavorite(id: string, favorite: boolean): Promise<void> {
	await db.update(bookmark).set({ favorite }).where(eq(bookmark.id, id));
}
