import { taskActions } from '$lib/server/task-actions';
import { listNotes } from '$lib/server/notes';
import { requireUserId } from '$lib/server/session';
import { listTasks } from '$lib/server/tasks';
import { listVaultEntries } from '$lib/server/vault';
import { ALL_TASKS } from '$lib/tasks/filters';
import type { Actions, PageServerLoad } from './$types.js';

// One load feeds all three widgets: the full lists are fetched once and each
// widget's slice is derived by the pure helpers in $lib/dashboard/select.
export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = requireUserId(locals);
	const [tasks, notes, entries] = await Promise.all([
		listTasks(ownerId, ALL_TASKS),
		listNotes(ownerId),
		listVaultEntries(ownerId)
	]);

	return { tasks, notes, entries };
};

// Quick add reuses the shared task action (same as /tasks).
export const actions: Actions = { quickAdd: taskActions.quickAdd };
