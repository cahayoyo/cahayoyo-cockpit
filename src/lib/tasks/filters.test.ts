import { describe, expect, test } from 'bun:test';
import {
	DUE_KEYS,
	SORT_KEYS,
	filterTasks,
	normalizePriorityFilter,
	normalizeStatusFilter,
	sortTasks,
	type FilterableTask,
	type TaskFilters
} from './filters';

type Row = FilterableTask & { id: string };

const TODAY = '2026-09-18';

const rows: Row[] = [
	{
		id: 't1',
		title: 'Regression checklist',
		description: 'Add the reset flow cases',
		projectId: 'p1',
		status: 'in_progress',
		priority: 'high',
		dueDate: '2026-09-16',
		tags: ['qa', 'auth'],
		createdAt: new Date('2026-09-10T03:00:00Z')
	},
	{
		id: 't2',
		title: 'Retest checkout',
		description: null,
		projectId: 'p1',
		status: 'review',
		priority: 'urgent',
		dueDate: '2026-09-18',
		tags: ['checkout'],
		createdAt: new Date('2026-09-11T03:00:00Z')
	},
	{
		id: 't3',
		title: 'Write test plan',
		description: 'Reports export',
		projectId: 'p2',
		status: 'backlog',
		priority: 'medium',
		dueDate: '2026-09-22',
		tags: ['qa'],
		createdAt: new Date('2026-09-12T03:00:00Z')
	},
	{
		id: 't4',
		title: 'Ship release notes',
		description: null,
		projectId: 'p2',
		status: 'done',
		priority: 'low',
		dueDate: null,
		tags: [],
		createdAt: new Date('2026-09-13T03:00:00Z')
	},
	{
		id: 't5',
		title: 'Overdue but done',
		description: null,
		projectId: 'p1',
		status: 'done',
		priority: 'low',
		dueDate: '2026-09-15',
		tags: [],
		createdAt: new Date('2026-09-09T03:00:00Z')
	}
];

const STATUS_VALUES = [
	'backlog',
	'in_progress',
	'review',
	'waiting_for_acceptance',
	'waiting_for_deployment',
	'done'
];
const PRIORITY_VALUES = ['low', 'medium', 'high', 'urgent'];

const defaults: TaskFilters = {
	projectId: null,
	status: 'active',
	priority: 'all',
	tag: null,
	due: 'any',
	q: '',
	sort: 'due'
};

function ids(items: { id: string }[]): string[] {
	return items.map((item) => item.id);
}

function filtered(filters: Partial<TaskFilters>): string[] {
	return ids(filterTasks(rows, { ...defaults, ...filters }, TODAY));
}

describe('filterTasks', () => {
	test('defaults to Active, excluding Done', () => {
		expect(filtered({})).toEqual(['t1', 't2', 't3']);
	});

	test('filters by project', () => {
		expect(filtered({ projectId: 'p2' })).toEqual(['t3']);
	});

	test('status all keeps Done, a specific status matches exactly', () => {
		expect(filtered({ status: 'all' })).toEqual(['t1', 't2', 't3', 't4', 't5']);
		expect(filtered({ status: 'done' })).toEqual(['t4', 't5']);
	});

	test('filters by priority', () => {
		expect(filtered({ priority: 'urgent' })).toEqual(['t2']);
	});

	test('filters by tag', () => {
		expect(filtered({ tag: 'qa' })).toEqual(['t1', 't3']);
	});

	test('overdue matches past due dates and never Done tasks', () => {
		expect(filtered({ due: 'overdue' })).toEqual(['t1']);
	});

	test('today matches the current app-zone date only', () => {
		expect(filtered({ due: 'today' })).toEqual(['t2']);
	});

	test('today_or_overdue matches overdue and today, never later dates', () => {
		expect(filtered({ due: 'today_or_overdue' })).toEqual(['t1', 't2']);
		expect(filtered({ due: 'today_or_overdue', status: 'all' })).toEqual(['t1', 't2', 't5']);
	});

	test('next7 matches today through today+7', () => {
		expect(filtered({ due: 'next7' })).toEqual(['t2', 't3']);
	});

	test('none matches tasks without a due date', () => {
		expect(filtered({ due: 'none', status: 'all' })).toEqual(['t4']);
	});

	test('searches title and description case-insensitively', () => {
		expect(filtered({ q: 'CHECKOUT' })).toEqual(['t2']);
		expect(filtered({ q: 'reset' })).toEqual(['t1']);
		expect(filtered({ q: 'nothing here' })).toEqual([]);
	});

	test('does not mutate the input array', () => {
		const input = [...rows];
		filterTasks(input, defaults, TODAY);
		expect(ids(input)).toEqual(['t1', 't2', 't3', 't4', 't5']);
	});
});

describe('sortTasks', () => {
	test('due date ascending with nulls last', () => {
		expect(ids(sortTasks(rows, 'due', PRIORITY_VALUES))).toEqual(['t5', 't1', 't2', 't3', 't4']);
	});

	test('priority most urgent first, then stable', () => {
		expect(ids(sortTasks(rows, 'priority', PRIORITY_VALUES))).toEqual([
			't2',
			't1',
			't3',
			't4',
			't5'
		]);
	});

	test('newest first by creation time', () => {
		expect(ids(sortTasks(rows, 'newest', PRIORITY_VALUES))).toEqual(['t4', 't3', 't2', 't1', 't5']);
	});
});

describe('filter keys', () => {
	test('the due and sort key lists match the URL contract', () => {
		expect(DUE_KEYS).toEqual(['any', 'overdue', 'today', 'today_or_overdue', 'next7', 'none']);
		expect(SORT_KEYS).toEqual(['due', 'priority', 'newest']);
	});
});

describe('normalizeStatusFilter', () => {
	test('keeps the pseudo-filters and known enum values', () => {
		expect(normalizeStatusFilter('all', STATUS_VALUES)).toBe('all');
		expect(normalizeStatusFilter('active', STATUS_VALUES)).toBe('active');
		expect(normalizeStatusFilter('done', STATUS_VALUES)).toBe('done');
	});

	test('unknown values degrade to the Active default', () => {
		expect(normalizeStatusFilter('', STATUS_VALUES)).toBe('active');
		expect(normalizeStatusFilter('archived', STATUS_VALUES)).toBe('active');
	});
});

describe('normalizePriorityFilter', () => {
	test('keeps known enum values and degrades unknown ones to all', () => {
		expect(normalizePriorityFilter('urgent', PRIORITY_VALUES)).toBe('urgent');
		expect(normalizePriorityFilter('all', PRIORITY_VALUES)).toBe('all');
		expect(normalizePriorityFilter('critical', PRIORITY_VALUES)).toBe('all');
	});
});
