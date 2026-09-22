import type { SortKey } from '$lib/bookmarks/filters';
import type { BookmarkView } from '$lib/bookmarks/params';

// View models the page hands to the bookmarks components. The server layer
// returns richer rows that structurally satisfy these shapes.
export type BookmarkItem = {
	id: string;
	title: string;
	url: string;
	description: string | null;
	favorite: boolean;
	imageId: string | null;
	folderId: string | null;
	tags: string[];
};

export type MediaItem = {
	id: string;
	originalName: string;
	sizeBytes: number;
	usageCount: number;
};

export type ViewProps = {
	items: BookmarkItem[];
	onedit: (bookmark: BookmarkItem) => void;
	ondelete: (bookmark: BookmarkItem) => void;
};

// URL-filter patch: omitted keys keep their current value, `null` clears the filter.
export type FilterPatch = {
	q?: string;
	favorite?: boolean;
	tag?: string | null;
	sort?: SortKey;
	folder?: string | null;
	view?: BookmarkView;
};
