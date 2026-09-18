import { describe, expect, test } from 'bun:test';
import { projectNameSchema, taskFormSchema } from './schemas';

const PROJECT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const valid = {
	title: '  Fix login regression  ',
	description: 'Add the reset flow cases',
	projectId: PROJECT_ID,
	priority: 'high',
	dueDate: '2026-09-20',
	parentId: null,
	tags: 'QA, auth, qa'
};

describe('taskFormSchema', () => {
	test('trims the title and normalizes the tags', () => {
		const parsed = taskFormSchema.parse(valid);
		expect(parsed.title).toBe('Fix login regression');
		expect(parsed.tags).toEqual(['qa', 'auth']);
	});

	test('turns an empty due date into no due date', () => {
		expect(taskFormSchema.parse({ ...valid, dueDate: '' }).dueDate).toBeNull();
	});

	test('rejects an empty title, a bad project, a bad due date, and an unknown priority', () => {
		expect(taskFormSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
		expect(taskFormSchema.safeParse({ ...valid, projectId: 'not-a-uuid' }).success).toBe(false);
		expect(taskFormSchema.safeParse({ ...valid, dueDate: '20-09-2026' }).success).toBe(false);
		expect(taskFormSchema.safeParse({ ...valid, priority: 'critical' }).success).toBe(false);
	});

	test('accepts a subtask parent and rejects a malformed one', () => {
		expect(taskFormSchema.safeParse({ ...valid, parentId: PROJECT_ID }).success).toBe(true);
		expect(taskFormSchema.safeParse({ ...valid, parentId: '' }).success).toBe(false);
	});
});

describe('projectNameSchema', () => {
	test('trims and keeps a non-empty name', () => {
		expect(projectNameSchema.parse('  Website Revamp ')).toBe('Website Revamp');
	});

	test('rejects an empty name and one over the length limit', () => {
		expect(projectNameSchema.safeParse('   ').success).toBe(false);
		expect(projectNameSchema.safeParse('a'.repeat(101)).success).toBe(false);
	});
});
