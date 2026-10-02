import { describe, expect, test } from 'bun:test';
import type { FilterableTask } from '$lib/tasks/filters';
import {
	ACTIVE_TASK_STATUSES,
	selectActiveTasks,
	selectFavoriteBookmarks,
	selectRecentNotes,
	selectRecentVault
} from './select';

type Task = FilterableTask & { id: string };

function task(id: string, status: string, dueDate: string | null = null): Task {
	return {
		id,
		title: id,
		description: null,
		projectId: 'p1',
		status,
		priority: 'medium',
		dueDate,
		tags: [],
		createdAt: new Date('2026-09-01T03:00:00Z')
	};
}

describe('selectActiveTasks', () => {
	test('keeps the four active statuses and counts each', () => {
		const { items, counts } = selectActiveTasks([
			task('backlog', 'backlog'),
			task('progress', 'in_progress'),
			task('review', 'review'),
			task('done', 'done'),
			task('acceptance', 'waiting_for_acceptance'),
			task('deployment', 'waiting_for_deployment')
		]);

		expect(items.map((item) => item.id)).toEqual([
			'progress',
			'review',
			'acceptance',
			'deployment'
		]);
		expect(Object.keys(counts).sort()).toEqual([...ACTIVE_TASK_STATUSES].sort());
		expect(counts.in_progress).toBe(1);
		expect(counts.waiting_for_deployment).toBe(1);
	});

	test('caps items at 5 and omits statuses with no tasks', () => {
		const tasks = [
			...Array.from({ length: 6 }, (_, index) => task(`p${index}`, 'in_progress')),
			task('r', 'review')
		];

		const { items, counts } = selectActiveTasks(tasks);

		expect(items).toHaveLength(5);
		expect(counts.in_progress).toBe(6);
		expect(counts.review).toBe(1);
		expect(counts.waiting_for_acceptance).toBeUndefined();
	});
});

describe('selectRecentNotes', () => {
	test('sorts by updatedAt desc, ignoring pinned, capped at 5', () => {
		const notes = Array.from({ length: 6 }, (_, index) => ({
			id: `n${index}`,
			pinned: index === 5,
			updatedAt: new Date(`2026-09-1${index}T03:00:00Z`)
		}));

		const items = selectRecentNotes(notes);

		expect(items.map((note) => note.id)).toEqual(['n5', 'n4', 'n3', 'n2', 'n1']);
	});
});

describe('selectFavoriteBookmarks', () => {
	test('keeps favorites only, capped at 6', () => {
		const bookmarks = Array.from({ length: 8 }, (_, index) => ({
			id: `b${index}`,
			favorite: index !== 3
		}));

		const items = selectFavoriteBookmarks(bookmarks);

		expect(items.map((bookmark) => bookmark.id)).toEqual(['b0', 'b1', 'b2', 'b4', 'b5', 'b6']);
	});
});

describe('selectRecentVault', () => {
	test('sorts by updatedAt desc, capped at 5', () => {
		const entries = Array.from({ length: 6 }, (_, index) => ({
			id: `v${index}`,
			updatedAt: new Date(`2026-09-1${index}T03:00:00Z`)
		}));

		const items = selectRecentVault(entries);

		expect(items.map((entry) => entry.id)).toEqual(['v5', 'v4', 'v3', 'v2', 'v1']);
	});
});
