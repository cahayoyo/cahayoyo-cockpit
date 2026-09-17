import { describe, expect, test } from 'bun:test';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';
import { filterBookmarks, type BookmarkFilters, type FilterableBookmark } from './filters';

type Row = FilterableBookmark & { id: string };

const rows: Row[] = [
	{
		id: 'b1',
		title: 'SvelteKit documentation',
		url: 'https://svelte.dev/docs',
		favorite: true,
		tags: ['svelte', 'docs'],
		folderId: 'qa',
		createdAt: new Date('2026-09-10T10:00:00Z')
	},
	{
		id: 'b2',
		title: 'Drizzle column types',
		url: 'https://orm.drizzle.team/docs/column-types',
		favorite: false,
		tags: ['db', 'docs'],
		folderId: 'devops',
		createdAt: new Date('2026-09-12T10:00:00Z')
	},
	{
		id: 'b3',
		title: 'Playwright best practices',
		url: 'https://playwright.dev/docs/best-practices',
		favorite: true,
		tags: ['qa'],
		folderId: null,
		createdAt: new Date('2026-09-11T10:00:00Z')
	},
	{
		id: 'b4',
		title: 'Automation notes',
		url: 'https://example.com/automation',
		favorite: false,
		tags: ['qa', 'docs'],
		folderId: 'automation',
		createdAt: new Date('2026-09-13T10:00:00Z')
	}
];

const defaults: BookmarkFilters = {
	q: '',
	favorite: false,
	tag: null,
	sort: 'newest',
	folderId: null
};

function ids(items: { id: string }[]): string[] {
	return items.map((item) => item.id);
}

describe('filterBookmarks', () => {
	test('returns everything newest-first with default filters', () => {
		expect(ids(filterBookmarks(rows, defaults))).toEqual(['b4', 'b2', 'b3', 'b1']);
	});

	test('search matches title and url case-insensitively across all folders', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, q: 'DRIZZLE' }))).toEqual(['b2']);
		expect(ids(filterBookmarks(rows, { ...defaults, q: 'playwright.dev' }))).toEqual(['b3']);
	});

	test('search ignores the folder scope (q is always global)', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, q: 'docs', folderId: 'qa' }))).toEqual([
			'b2',
			'b3',
			'b1'
		]);
	});

	test('root scope matches unfiled bookmarks only', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, folderId: ROOT_FOLDER_ID }))).toEqual(['b3']);
	});

	test('folder scope matches direct contents only, never descendants', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, folderId: 'qa' }))).toEqual(['b1']);
		expect(ids(filterBookmarks(rows, { ...defaults, folderId: 'automation' }))).toEqual(['b4']);
	});

	test('filters to favorites only', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, favorite: true }))).toEqual(['b3', 'b1']);
	});

	test('filters by a single tag', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, tag: 'qa' }))).toEqual(['b4', 'b3']);
	});

	test('sorts by title A-Z', () => {
		expect(ids(filterBookmarks(rows, { ...defaults, sort: 'title' }))).toEqual([
			'b4',
			'b2',
			'b3',
			'b1'
		]);
	});

	test('does not mutate the input array', () => {
		const input = [...rows];
		filterBookmarks(input, { ...defaults, sort: 'title' });
		expect(ids(input)).toEqual(['b1', 'b2', 'b3', 'b4']);
	});
});
