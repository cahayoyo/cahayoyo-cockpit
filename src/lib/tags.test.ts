import { describe, expect, test } from 'bun:test';
import { groupTagNames, parseTags } from './tags';

describe('parseTags', () => {
	test('splits on commas and trims each value', () => {
		expect(parseTags(' svelte , docs ')).toEqual(['svelte', 'docs']);
	});

	test('lowercases values', () => {
		expect(parseTags('SvelteKit, DOCS')).toEqual(['sveltekit', 'docs']);
	});

	test('deduplicates case-insensitively, keeping the first occurrence', () => {
		expect(parseTags('Docs, docs, DOCS, svelte')).toEqual(['docs', 'svelte']);
	});

	test('drops empty entries', () => {
		expect(parseTags('a,,  ,b,')).toEqual(['a', 'b']);
	});

	test('returns an empty list for empty input', () => {
		expect(parseTags('')).toEqual([]);
		expect(parseTags(' , , ')).toEqual([]);
	});
});

describe('groupTagNames', () => {
	test('groups names per owner, preserving the incoming order', () => {
		const grouped = groupTagNames([
			{ id: 'a', name: 'docs' },
			{ id: 'b', name: 'qa' },
			{ id: 'a', name: 'release' }
		]);

		expect(grouped.get('a')).toEqual(['docs', 'release']);
		expect(grouped.get('b')).toEqual(['qa']);
	});

	test('returns an empty map for no links', () => {
		expect(groupTagNames([]).size).toBe(0);
	});
});
