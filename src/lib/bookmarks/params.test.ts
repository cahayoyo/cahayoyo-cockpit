import { describe, expect, test } from 'bun:test';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';
import type { BookmarkFilters } from './filters';
import { buildBookmarkSearch, parseBookmarkSearch, parseBookmarkView } from './params';

const FOLDER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const defaults: BookmarkFilters = {
	q: '',
	favorite: false,
	tag: null,
	sort: 'newest',
	folderId: ROOT_FOLDER_ID
};

function parse(query: string): BookmarkFilters {
	return parseBookmarkSearch(new URLSearchParams(query));
}

describe('parseBookmarkSearch', () => {
	test('returns safe defaults for missing params', () => {
		expect(parse('')).toEqual(defaults);
	});

	test('trims the query', () => {
		expect(parse('q=%20drizzle%20').q).toBe('drizzle');
	});

	test('parses favorite only on exact true/false, degrading to false', () => {
		expect(parse('favorite=true').favorite).toBe(true);
		expect(parse('favorite=false').favorite).toBe(false);
		expect(parse('favorite=yes').favorite).toBe(false);
		expect(parse('favorite=').favorite).toBe(false);
	});

	test('keeps a known tag, drops empty ones', () => {
		expect(parse('tag=svelte').tag).toBe('svelte');
		expect(parse('tag=%20').tag).toBeNull();
	});

	test('lowercases the tag, matching the canonical tag form', () => {
		expect(parse('tag=Docs').tag).toBe('docs');
	});

	test('falls back to newest on unknown sort keys', () => {
		expect(parse('sort=title').sort).toBe('title');
		expect(parse('sort=oldest').sort).toBe('newest');
	});

	test('keeps a valid folder id and falls back to the root otherwise', () => {
		expect(parse(`folder=${FOLDER_ID}`).folderId).toBe(FOLDER_ID);
		expect(parse('folder=not-a-uuid').folderId).toBe(ROOT_FOLDER_ID);
		expect(parse('folder=').folderId).toBe(ROOT_FOLDER_ID);
	});

	test('keeps the folder when a query is present (scope is resolved during filtering)', () => {
		expect(parse(`q=docs&folder=${FOLDER_ID}`)).toEqual({
			...defaults,
			q: 'docs',
			folderId: FOLDER_ID
		});
	});
});

describe('parseBookmarkView', () => {
	test('accepts the two known views', () => {
		expect(parseBookmarkView(new URLSearchParams('view=grid'))).toBe('grid');
		expect(parseBookmarkView(new URLSearchParams('view=list'))).toBe('list');
	});

	test('degrades to grid for missing or unknown values', () => {
		expect(parseBookmarkView(new URLSearchParams(''))).toBe('grid');
		expect(parseBookmarkView(new URLSearchParams('view=editorial'))).toBe('grid');
	});
});

describe('buildBookmarkSearch', () => {
	test('omits every default so the URL stays clean', () => {
		expect(buildBookmarkSearch(defaults, 'grid')).toBe('');
	});

	test('round-trips a fully-populated filter set', () => {
		const filters: BookmarkFilters = {
			q: 'drizzle docs',
			favorite: true,
			tag: 'db',
			sort: 'title',
			folderId: FOLDER_ID
		};
		const query = buildBookmarkSearch(filters, 'list');
		expect(parseBookmarkSearch(new URLSearchParams(query))).toEqual(filters);
		expect(query).toContain('view=list');
	});

	test('escapes values that need encoding', () => {
		const query = buildBookmarkSearch({ ...defaults, q: 'a&b=c' }, 'grid');
		expect(parseBookmarkSearch(new URLSearchParams(query)).q).toBe('a&b=c');
	});
});
