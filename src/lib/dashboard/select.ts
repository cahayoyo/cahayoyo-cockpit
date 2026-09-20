// Pure selection helpers for the dashboard widgets (variant A): the route load
// fetches the full lists once and these helpers derive the widget-sized slices.

export const ACTIVE_TASK_STATUSES = [
	'in_progress',
	'review',
	'waiting_for_acceptance',
	'waiting_for_deployment'
] as const;

export type ActiveTaskStatus = (typeof ACTIVE_TASK_STATUSES)[number];

const TODAY_LIMIT = 5;
const ACTIVE_LIMIT = 5;
const RECENT_NOTES_LIMIT = 5;
const FAVORITE_BOOKMARKS_LIMIT = 6;

type DueTask = { status: string; dueDate: string | null };
type StatusTask = { status: string };
type DatedNote = { updatedAt: Date };
type FavoriteBookmark = { favorite: boolean };

function isActiveStatus(status: string): status is ActiveTaskStatus {
	return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

/** Due today or overdue and not Done, soonest first, capped; `hidden` counts the rest. */
export function selectTodayTasks<T extends DueTask>(
	tasks: readonly T[],
	today: string
): { items: T[]; hidden: number } {
	const due = tasks
		.filter(
			(task): task is T & { dueDate: string } =>
				task.dueDate !== null && task.dueDate <= today && task.status !== 'done'
		)
		.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

	return { items: due.slice(0, TODAY_LIMIT), hidden: Math.max(0, due.length - TODAY_LIMIT) };
}

/** Tasks in the four active statuses: capped items plus a per-status count. */
export function selectActiveTasks<T extends StatusTask>(
	tasks: readonly T[]
): {
	items: T[];
	counts: Partial<Record<ActiveTaskStatus, number>>;
} {
	const active = tasks.filter((task): task is T & { status: ActiveTaskStatus } =>
		isActiveStatus(task.status)
	);

	const counts: Partial<Record<ActiveTaskStatus, number>> = {};
	for (const task of active) {
		counts[task.status] = (counts[task.status] ?? 0) + 1;
	}

	return { items: active.slice(0, ACTIVE_LIMIT), counts };
}

/** The most recently updated notes, capped; pinning does not reorder this list. */
export function selectRecentNotes<T extends DatedNote>(notes: readonly T[]): T[] {
	return [...notes]
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		.slice(0, RECENT_NOTES_LIMIT);
}

/** Favorite bookmarks only, capped. */
export function selectFavoriteBookmarks<T extends FavoriteBookmark>(bookmarks: readonly T[]): T[] {
	return bookmarks.filter((bookmark) => bookmark.favorite).slice(0, FAVORITE_BOOKMARKS_LIMIT);
}
