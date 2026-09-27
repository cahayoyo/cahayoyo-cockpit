import { describe, expect, test } from 'bun:test';
import { optionalId, requiredId } from './form-data';

const REAL_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
// The seeded Inbox project id (version 0): not a valid RFC 9562 UUID.
const SEEDED_ID = '00000000-0000-0000-0000-000000000001';

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
		expect(requiredId(form({ id: SEEDED_ID }))).toBe(SEEDED_ID);
	});

	test('reads a custom field and degrades missing or malformed values', () => {
		expect(requiredId(form({ projectId: SEEDED_ID }), 'projectId')).toBe(SEEDED_ID);
		expect(requiredId(form({ id: 'not-a-uuid' }))).toBeNull();
		expect(requiredId(form({}))).toBeNull();
	});
});

describe('optionalId', () => {
	test('keeps a valid value, including the seeded Inbox id', () => {
		expect(optionalId(form({ parentId: REAL_ID }), 'parentId')).toBe(REAL_ID);
		expect(optionalId(form({ parentId: SEEDED_ID }), 'parentId')).toBe(SEEDED_ID);
	});

	test('degrades empty and malformed values to none', () => {
		expect(optionalId(form({ parentId: '' }), 'parentId')).toBeNull();
		expect(optionalId(form({ parentId: 'not-a-uuid' }), 'parentId')).toBeNull();
		expect(optionalId(form({}), 'parentId')).toBeNull();
	});
});
