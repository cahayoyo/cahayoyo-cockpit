import { describe, expect, test } from 'bun:test';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';
import { buildNoteSearch, parseNoteSearch } from './params';

const NOTE_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const FOLDER_ID = '9c858901-8a57-4509-9d5d-4b0f52b7f2a4';

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

describe('buildNoteSearch', () => {
	const root = { noteId: null, q: '', folderId: ROOT_FOLDER_ID };

	test('produces an empty string for the default state', () => {
		expect(buildNoteSearch(root)).toBe('');
	});

	test('omits the root folder and a null folder', () => {
		expect(buildNoteSearch({ ...root, folderId: null })).toBe('');
		expect(buildNoteSearch({ ...root, folderId: ROOT_FOLDER_ID })).toBe('');
	});

	test('encodes the query', () => {
		expect(buildNoteSearch({ ...root, q: 'a b&c' })).toBe('q=a%20b%26c');
	});

	test('includes the selected note and folder', () => {
		expect(buildNoteSearch({ noteId: NOTE_ID, q: '', folderId: FOLDER_ID })).toBe(
			`folder=${FOLDER_ID}&note=${NOTE_ID}`
		);
	});

	test('round-trips through parseNoteSearch', () => {
		const query = buildNoteSearch({ noteId: NOTE_ID, q: 'release notes', folderId: FOLDER_ID });
		expect(parse(query)).toEqual({ noteId: NOTE_ID, q: 'release notes' });
	});
});
