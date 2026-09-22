import { z } from 'zod';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';
import { SORT_KEYS, type BookmarkFilters } from './filters';

export const bookmarkSearchSchema = z.object({
	q: z.string().trim().catch(''),
	favorite: z
		.enum(['true', 'false'])
		.catch('false')
		.transform((value) => value === 'true'),
	tag: z.string().trim().toLowerCase().catch(''),
	sort: z.enum(SORT_KEYS).catch('newest'),
	folder: z.uuid().catch('')
});

export const bookmarkViewSchema = z.enum(['grid', 'list']).catch('grid');

export type BookmarkView = z.infer<typeof bookmarkViewSchema>;

// Unknown or missing values degrade to the default grid view.
export function parseBookmarkView(params: URLSearchParams): BookmarkView {
	return bookmarkViewSchema.parse(params.get('view') ?? 'grid');
}

// Unknown or malformed params degrade to the safe default: no search, no
// filters, newest first, root folder (unfiled bookmarks).
export function parseBookmarkSearch(params: URLSearchParams): BookmarkFilters {
	const parsed = bookmarkSearchSchema.parse({
		q: params.get('q') ?? '',
		favorite: params.get('favorite') ?? 'false',
		tag: params.get('tag') ?? '',
		sort: params.get('sort') ?? 'newest',
		folder: params.get('folder') ?? ''
	});

	return {
		q: parsed.q,
		favorite: parsed.favorite,
		tag: parsed.tag || null,
		sort: parsed.sort,
		folderId: parsed.folder || ROOT_FOLDER_ID
	};
}

// Inverse of parseBookmarkSearch: the canonical query string for a filter set and
// view. Default values are omitted, so a default state produces an empty string.
export function buildBookmarkSearch(filters: BookmarkFilters, view: BookmarkView): string {
	const parts: string[] = [];
	if (filters.q) parts.push(`q=${encodeURIComponent(filters.q)}`);
	if (filters.favorite) parts.push('favorite=true');
	if (filters.tag) parts.push(`tag=${encodeURIComponent(filters.tag)}`);
	if (filters.sort !== 'newest') parts.push(`sort=${filters.sort}`);
	if (filters.folderId && filters.folderId !== ROOT_FOLDER_ID) {
		parts.push(`folder=${filters.folderId}`);
	}
	if (view === 'list') parts.push('view=list');

	return parts.join('&');
}
