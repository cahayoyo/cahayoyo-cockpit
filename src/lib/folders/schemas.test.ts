import { describe, expect, test } from 'bun:test';
import { folderFormSchema } from './schemas';

const FOLDER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('folderFormSchema', () => {
	test('trims the folder name', () => {
		expect(folderFormSchema.parse({ name: '  automation  ', parentId: null })).toEqual({
			name: 'automation',
			parentId: null
		});
	});

	test('rejects blank names', () => {
		expect(folderFormSchema.safeParse({ name: '   ', parentId: null }).success).toBe(false);
	});

	test('accepts a uuid parent and rejects garbage', () => {
		expect(folderFormSchema.safeParse({ name: 'qa', parentId: FOLDER_ID }).success).toBe(true);
		expect(folderFormSchema.safeParse({ name: 'qa', parentId: 'nope' }).success).toBe(false);
	});
});
