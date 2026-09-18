import { describe, expect, test } from 'bun:test';
import { canAssignParent } from './subtasks';

describe('canAssignParent', () => {
	test('a top-level task can be a parent', () => {
		expect(canAssignParent(null, { id: 'p1', parentId: null })).toBe(true);
		expect(canAssignParent('t2', { id: 'p1', parentId: null })).toBe(true);
	});

	test('a subtask can never be a parent', () => {
		expect(canAssignParent(null, { id: 's1', parentId: 'p1' })).toBe(false);
		expect(canAssignParent('t2', { id: 's1', parentId: 'p1' })).toBe(false);
	});

	test('a task cannot be its own parent', () => {
		expect(canAssignParent('t1', { id: 't1', parentId: null })).toBe(false);
	});
});
