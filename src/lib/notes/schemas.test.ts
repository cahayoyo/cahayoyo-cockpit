import { describe, expect, test } from 'bun:test';
import { noteFormSchema } from './schemas';

const FOLDER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('noteFormSchema', () => {
	test('trims the title and parses tags', () => {
		const parsed = noteFormSchema.parse({
			title: '  Release notes  ',
			body: 'body',
			folderId: null,
			tags: ' QA, Release, qa '
		});

		expect(parsed).toEqual({
			title: 'Release notes',
			body: 'body',
			folderId: null,
			tags: ['qa', 'release']
		});
	});

	test('allows an empty title so a rename never blocks autosave', () => {
		expect(
			noteFormSchema.safeParse({ title: '', body: '', folderId: null, tags: '' }).success
		).toBe(true);
	});

	test('accepts a uuid folder and rejects garbage', () => {
		const base = { title: 'x', body: '', tags: '' };
		expect(noteFormSchema.safeParse({ ...base, folderId: FOLDER_ID }).success).toBe(true);
		expect(noteFormSchema.safeParse({ ...base, folderId: null }).success).toBe(true);
		expect(noteFormSchema.safeParse({ ...base, folderId: 'nope' }).success).toBe(false);
	});
});
