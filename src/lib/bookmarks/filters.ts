import { ROOT_FOLDER_ID } from '$lib/folders/tree';

export const SORT_KEYS = ['newest', 'title'] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export type FilterableBookmark = {
	title: string;
	url: string;
	favorite: boolean;
	tags: readonly string[];
	folderId: string | null;
	createdAt: Date;
};

export type BookmarkFilters = {
	q: string;
	favorite: boolean;
	tag: string | null;
	sort: SortKey;
	// `null` = global scope (all folders); `ROOT_FOLDER_ID` = root (unfiled);
	// anything else = that folder's direct contents.
	folderId: string | null;
};

export function filterBookmarks<T extends FilterableBookmark>(
	bookmarks: readonly T[],
	filters: BookmarkFilters
): T[] {
	const q = filters.q.trim().toLowerCase();
	// Search is always global: a non-empty query ignores the folder scope.
	const folderId = q ? null : filters.folderId;

	return bookmarks
		.filter(
			(bookmark) =>
				(!q ||
					bookmark.title.toLowerCase().includes(q) ||
					bookmark.url.toLowerCase().includes(q)) &&
				(!filters.favorite || bookmark.favorite) &&
				(filters.tag === null || bookmark.tags.includes(filters.tag)) &&
				(folderId === null || (bookmark.folderId ?? ROOT_FOLDER_ID) === folderId)
		)
		.sort((a, b) =>
			filters.sort === 'title'
				? a.title.localeCompare(b.title)
				: b.createdAt.getTime() - a.createdAt.getTime()
		);
}
