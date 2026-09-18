import { addDaysIso } from './today';

export const SORT_KEYS = ['due', 'priority', 'newest'] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DUE_KEYS = ['any', 'overdue', 'today', 'today_or_overdue', 'next7', 'none'] as const;

export type DueFilter = (typeof DUE_KEYS)[number];

export type TaskFilters = {
	projectId: string | null;
	// 'all' | 'active' (excludes Done) | a task_status value. Unknown values are
	// degraded by the server, which owns the enum (normalizeStatusFilter).
	status: string;
	// 'all' | a task_priority value.
	priority: string;
	tag: string | null;
	due: DueFilter;
	q: string;
	sort: SortKey;
};

export type FilterableTask = {
	title: string;
	description: string | null;
	projectId: string;
	status: string;
	priority: string;
	dueDate: string | null;
	tags: readonly string[];
	createdAt: Date;
};

// "Next 7 days" covers today through today+7 (prototype semantics).
const DUE_WINDOW_DAYS = 7;

function matchesDue(task: FilterableTask, due: DueFilter, today: string): boolean {
	switch (due) {
		case 'overdue':
			return task.dueDate !== null && task.dueDate < today && task.status !== 'done';
		case 'today':
			return task.dueDate === today;
		case 'today_or_overdue':
			return task.dueDate !== null && task.dueDate <= today;
		case 'next7':
			return (
				task.dueDate !== null &&
				task.dueDate >= today &&
				task.dueDate <= addDaysIso(today, DUE_WINDOW_DAYS)
			);
		case 'none':
			return task.dueDate === null;
		default:
			return true;
	}
}

export function filterTasks<T extends FilterableTask>(
	tasks: readonly T[],
	filters: TaskFilters,
	today: string
): T[] {
	const q = filters.q.trim().toLowerCase();

	return tasks.filter((task) => {
		if (filters.projectId !== null && task.projectId !== filters.projectId) {
			return false;
		}
		if (filters.status === 'active' && task.status === 'done') {
			return false;
		}
		if (filters.status !== 'active' && filters.status !== 'all' && task.status !== filters.status) {
			return false;
		}
		if (filters.priority !== 'all' && task.priority !== filters.priority) {
			return false;
		}
		if (filters.tag !== null && !task.tags.includes(filters.tag)) {
			return false;
		}
		if (!matchesDue(task, filters.due, today)) {
			return false;
		}
		if (
			q !== '' &&
			!task.title.toLowerCase().includes(q) &&
			!(task.description ?? '').toLowerCase().includes(q)
		) {
			return false;
		}

		return true;
	});
}

/**
 * Sorts a copy of the list. `priorities` is the enum's value order, least to
 * most urgent (`taskPriority.enumValues`), so the values never get re-listed
 * here; unknown priorities sort last.
 */
export function sortTasks<T extends FilterableTask>(
	tasks: readonly T[],
	sort: SortKey,
	priorities: readonly string[]
): T[] {
	const copy = [...tasks];

	switch (sort) {
		case 'priority': {
			const rank = (priority: string) => priorities.indexOf(priority);
			return copy.sort((a, b) => rank(b.priority) - rank(a.priority));
		}
		case 'newest':
			return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		default:
			return copy.sort((a, b) => {
				if (a.dueDate === null && b.dueDate === null) return 0;
				if (a.dueDate === null) return 1;
				if (b.dueDate === null) return -1;
				return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
			});
	}
}

/** Unknown or dead status values degrade to the Active default. */
export function normalizeStatusFilter(status: string, values: readonly string[]): string {
	if (status === 'all' || status === 'active') {
		return status;
	}

	return values.includes(status) ? status : 'active';
}

/** Unknown priority values degrade to All. */
export function normalizePriorityFilter(priority: string, values: readonly string[]): string {
	return values.includes(priority) ? priority : 'all';
}
