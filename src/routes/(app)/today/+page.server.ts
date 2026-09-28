import { ALL_TASKS } from '$lib/tasks/filters';
import { todayIso } from '$lib/tasks/today';
import { taskActions } from '$lib/server/task-actions';
import { requireUserId } from '$lib/server/session';
import { listProjects, listTasks } from '$lib/server/tasks';
import { listTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

// The page derives the Today scope from one unfiltered task list: a subtask's
// parent is usually not due today, but the row still needs its label.
export const load: PageServerLoad = async ({ locals }) => {
	const ownerId = requireUserId(locals);
	const [projects, tasks, tags] = await Promise.all([
		listProjects(ownerId),
		listTasks(ownerId, ALL_TASKS),
		listTags(ownerId, 'task')
	]);

	return { projects, tasks, tags, today: todayIso() };
};

// Quick add is the shared task action (same as the dashboard).
export const actions: Actions = { ...taskActions };
