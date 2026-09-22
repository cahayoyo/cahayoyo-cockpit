import { describe, expect, test } from 'bun:test';
import { deleteTaskDescription, projectName } from './presentation';

describe('projectName', () => {
	test('returns the project name or an empty string', () => {
		const projects = [{ id: 'p1', name: 'Inbox' }];

		expect(projectName(projects, 'p1')).toBe('Inbox');
		expect(projectName(projects, 'missing')).toBe('');
	});
});

describe('deleteTaskDescription', () => {
	test('warns that a parent deletes its subtasks', () => {
		expect(deleteTaskDescription({ title: 'Parent', parentId: null })).toBe(
			'"Parent" will be deleted, together with its subtasks.'
		);
	});

	test('a subtask alone is deleted', () => {
		expect(deleteTaskDescription({ title: 'Child', parentId: 'p1' })).toBe(
			'"Child" will be deleted.'
		);
	});

	test('an untitled task falls back to "Untitled"', () => {
		expect(deleteTaskDescription({ title: '', parentId: 'p1' })).toBe(
			'"Untitled" will be deleted.'
		);
	});
});
