import { describe, expect, test } from 'bun:test';
import { parseNoteSearch } from './params';

const NOTE_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

function parse(query: string) {
	return parseNoteSearch(new URLSearchParams(query));
}

describe('parseNoteSearch', () => {
	test('returns safe defaults for missing params', () => {
		expect(parse('')).toEqual({ noteId: null, q: '' });
	});

	test('trims the query', () => {
		expect(parse('q=%20drizzle%20').q).toBe('drizzle');
	});

	test('keeps a valid note id and degrades malformed ones to no selection', () => {
		expect(parse(`note=${NOTE_ID}`).noteId).toBe(NOTE_ID);
		expect(parse('note=not-a-uuid').noteId).toBeNull();
		expect(parse('note=').noteId).toBeNull();
	});

	test('keeps note and query together', () => {
		expect(parse(`note=${NOTE_ID}&q=release`)).toEqual({ noteId: NOTE_ID, q: 'release' });
	});
});
