import { describe, expect, test } from 'bun:test';
import { extractMediaIds } from './media-refs';

const ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER = '9c858901-8a57-4791-81fe-4c455b099bc9';

describe('extractMediaIds', () => {
	test('finds a media reference in markdown image syntax', () => {
		expect(extractMediaIds(`before ![pasted image](/media/${ID}) after`)).toEqual([ID]);
	});

	test('finds plain paths and link syntax too', () => {
		expect(extractMediaIds(`/media/${ID}`)).toEqual([ID]);
		expect(extractMediaIds(`[open](/media/${ID})`)).toEqual([ID]);
	});

	test('returns every id once, however often a note repeats it', () => {
		expect(extractMediaIds(`![a](/media/${ID}) ![b](/media/${ID}) /media/${OTHER}`)).toEqual([
			ID,
			OTHER
		]);
	});

	test('lowercases ids so randomUUID casing never splits a reference', () => {
		expect(extractMediaIds(`/media/${ID.toUpperCase()}`)).toEqual([ID]);
	});

	test('ignores non-uuid and lookalike paths', () => {
		expect(extractMediaIds('![x](/media/mock-1) /media/ /media/not-a-uuid')).toEqual([]);
		expect(extractMediaIds('')).toEqual([]);
	});
});
