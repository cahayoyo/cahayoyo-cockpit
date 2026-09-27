import { listBookmarks } from '$lib/server/bookmarks';
import { taskActions } from '$lib/server/task-actions';
import { listNotes } from '$lib/server/notes';
import { requireUserId } from '$lib/server/session';
import { listTasks } from '$lib/server/tasks';
import { ALL_TASKS } from '$lib/tasks/filters';
import { todayIso } from '$lib/tasks/today';
import type { Actions, PageServerLoad } from './$types.js';

// One load feeds all four widgets: the full lists are fetched once and each
// widget's slice is derived by the pure helpers in $lib/dashboard/select.
export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = requireUserId(locals);
	const [tasks, notes, bookmarks] = await Promise.all([
		listTasks(ownerId, ALL_TASKS),
		listNotes(ownerId),
		listBookmarks(ownerId)
	]);

	return { tasks, notes, bookmarks, today: todayIso() };
};

// Quick add reuses the shared task action (same as /today).
export const actions: Actions = { quickAdd: taskActions.quickAdd };
