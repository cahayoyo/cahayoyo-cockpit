import { describe, expect, test } from 'bun:test';
import { optionalId, requiredId } from './form-data';

const INBOX_ID = '00000000-0000-0000-0000-000000000001';
const REAL_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

function form(values: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) {
		data.append(key, value);
	}
	return data;
}

describe('requiredId', () => {
	test('reads the default id field and accepts the seeded Inbox id', () => {
		expect(requiredId(form({ id: REAL_ID }))).toBe(REAL_ID);
		expect(requiredId(form({ id: INBOX_ID }))).toBe(INBOX_ID);
	});

	test('reads a custom field and degrades missing or malformed values', () => {
		expect(requiredId(form({ projectId: INBOX_ID }), 'projectId')).toBe(INBOX_ID);
		expect(requiredId(form({ id: 'not-a-uuid' }))).toBeNull();
		expect(requiredId(form({}))).toBeNull();
	});
});

describe('optionalId', () => {
	test('keeps a valid value', () => {
		expect(optionalId(form({ parentId: REAL_ID }), 'parentId')).toBe(REAL_ID);
	});

	test('degrades empty and malformed values to none', () => {
		expect(optionalId(form({ parentId: '' }), 'parentId')).toBeNull();
		expect(optionalId(form({ parentId: 'not-a-uuid' }), 'parentId')).toBeNull();
		expect(optionalId(form({}), 'parentId')).toBeNull();
	});
});
