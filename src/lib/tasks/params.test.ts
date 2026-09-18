import { describe, expect, test } from 'bun:test';
import { buildTaskSearch, parseTaskSearch, parseTaskView, type TaskSearch } from './params';

const PROJECT_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const TASK_ID = '9c858901-8a57-4509-9d5d-4b0f52b7f2a4';

const defaults: TaskSearch = {
	projectId: null,
	status: 'active',
	priority: 'all',
	tag: null,
	due: 'any',
	q: '',
	sort: 'due',
	taskId: null
};

function parse(query: string): TaskSearch {
	return parseTaskSearch(new URLSearchParams(query));
}

describe('parseTaskSearch', () => {
	test('returns safe defaults for missing params', () => {
		expect(parse('')).toEqual(defaults);
	});

	test('keeps a valid project id and degrades everything else to All projects', () => {
		expect(parse(`project=${PROJECT_ID}`).projectId).toBe(PROJECT_ID);
		expect(parse('project=all').projectId).toBeNull();
		expect(parse('project=not-a-uuid').projectId).toBeNull();
		expect(parse('project=').projectId).toBeNull();
	});

	test('keeps the seeded Inbox id (not an RFC 9562 UUID)', () => {
		const inboxId = '00000000-0000-0000-0000-000000000001';
		expect(parse(`project=${inboxId}`).projectId).toBe(inboxId);
		expect(parse(`task=${inboxId}`).taskId).toBe(inboxId);
	});

	test('trims the query without changing its case', () => {
		expect(parse('q=%20Drizzle%20').q).toBe('Drizzle');
	});

	test('lowercases status and priority, keeping unknown values for the server to degrade', () => {
		expect(parse('status=Done').status).toBe('done');
		expect(parse('status=archived').status).toBe('archived');
		expect(parse('priority=Urgent').priority).toBe('urgent');
	});

	test('keeps a known tag lowercased, drops empty ones', () => {
		expect(parse('tag=Docs').tag).toBe('docs');
		expect(parse('tag=%20').tag).toBeNull();
	});

	test('falls back to any due date and due-date sort on unknown keys', () => {
		expect(parse('due=next7').due).toBe('next7');
		expect(parse('due=soon').due).toBe('any');
		expect(parse('sort=priority').sort).toBe('priority');
		expect(parse('sort=oldest').sort).toBe('due');
	});

	test('keeps a valid open task id and degrades malformed ones', () => {
		expect(parse(`task=${TASK_ID}`).taskId).toBe(TASK_ID);
		expect(parse('task=not-a-uuid').taskId).toBeNull();
	});

	test('keeps a fully-populated filter set', () => {
		const search = parse(
			`project=${PROJECT_ID}&status=review&priority=high&tag=qa&due=overdue&q=login&sort=priority&task=${TASK_ID}`
		);
		expect(search).toEqual({
			projectId: PROJECT_ID,
			status: 'review',
			priority: 'high',
			tag: 'qa',
			due: 'overdue',
			q: 'login',
			sort: 'priority',
			taskId: TASK_ID
		});
	});
});

describe('parseTaskView', () => {
	test('accepts the two known views and degrades unknown ones to list', () => {
		expect(parseTaskView(new URLSearchParams('view=list'))).toBe('list');
		expect(parseTaskView(new URLSearchParams('view=kanban'))).toBe('kanban');
		expect(parseTaskView(new URLSearchParams(''))).toBe('list');
		expect(parseTaskView(new URLSearchParams('view=grid'))).toBe('list');
	});
});

describe('buildTaskSearch', () => {
	test('omits every default so the URL stays clean', () => {
		expect(buildTaskSearch(defaults, 'list')).toBe('');
	});

	test('round-trips a fully-populated filter set', () => {
		const search: TaskSearch = {
			projectId: PROJECT_ID,
			status: 'review',
			priority: 'high',
			tag: 'qa',
			due: 'next7',
			q: 'login flow',
			sort: 'priority',
			taskId: TASK_ID
		};
		const query = buildTaskSearch(search, 'kanban');
		expect(parseTaskSearch(new URLSearchParams(query))).toEqual(search);
		expect(query).toContain('view=kanban');
	});

	test('escapes values that need encoding', () => {
		const query = buildTaskSearch({ ...defaults, q: 'a&b=c' }, 'list');
		expect(parseTaskSearch(new URLSearchParams(query)).q).toBe('a&b=c');
	});
});
