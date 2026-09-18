import { describe, expect, test } from 'bun:test';
import { canAssignParent, groupByParent, subtaskProgress } from './subtasks';

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

describe('groupByParent', () => {
	test('groups subtasks under their parent and drops top-level tasks', () => {
		const tasks = [
			{ id: 'p1', parentId: null },
			{ id: 's1', parentId: 'p1' },
			{ id: 's2', parentId: 'p1' },
			{ id: 's3', parentId: 'p2' }
		];

		const map = groupByParent(tasks);

		expect(map.get('p1')?.map((task) => task.id)).toEqual(['s1', 's2']);
		expect(map.get('p2')?.map((task) => task.id)).toEqual(['s3']);
		expect(map.has(null as unknown as string)).toBe(false);
	});

	test('an empty list yields an empty map', () => {
		expect(groupByParent([]).size).toBe(0);
	});
});

describe('subtaskProgress', () => {
	test('counts done children over the total', () => {
		expect(subtaskProgress([{ status: 'done' }, { status: 'backlog' }])).toEqual({
			done: 1,
			total: 2
		});
	});

	test('no children is 0/0', () => {
		expect(subtaskProgress([])).toEqual({ done: 0, total: 0 });
	});
});
