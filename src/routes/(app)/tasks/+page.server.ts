import { fail } from '@sveltejs/kit';
import { ALL_TASKS } from '$lib/tasks/filters';
import { parseTaskSearch, parseTaskView } from '$lib/tasks/params';
import { todayIso } from '$lib/tasks/today';
import { taskActions } from '$lib/server/task-actions';
import { requiredId, text } from '$lib/server/form-data';
import { taskPriority, taskStatus } from '$lib/server/db/schema';
import {
	createProject,
	deleteProject,
	listProjects,
	listTasks,
	renameProject
} from '$lib/server/tasks';
import { projectNameSchema } from '$lib/server/tasks-schemas';
import { listTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

// The page derives every view from one unfiltered task list: subtask progress,
// parent labels and the board need tasks the active filters exclude. Filtering
// and sorting reuse the same pure helpers the server layer uses.
export const load: PageServerLoad = async ({ url }) => {
	const [projects, tasks, tags] = await Promise.all([
		listProjects(),
		listTasks(ALL_TASKS),
		listTags()
	]);

	return {
		filters: parseTaskSearch(url.searchParams),
		view: parseTaskView(url.searchParams),
		projects,
		tasks,
		tags,
		statusValues: taskStatus.enumValues,
		priorityValues: taskPriority.enumValues,
		today: todayIso()
	};
};

export const actions: Actions = {
	...taskActions,

	createProject: async ({ request }) => {
		const parsed = projectNameSchema.safeParse(text(await request.formData(), 'name'));
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid project.' });
		}

		return { projectId: await createProject(parsed.data) };
	},

	renameProject: async ({ request }) => {
		const formData = await request.formData();
		const parsed = projectNameSchema.safeParse(text(formData, 'name'));
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid project.' });
		}

		const id = requiredId(formData);
		if (!id) {
			return fail(400, { message: 'Invalid project.' });
		}

		if (!(await renameProject(id, parsed.data))) {
			return fail(404, { message: 'This project no longer exists.' });
		}

		return { renamed: true };
	},

	deleteProject: async ({ request }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid project.' });
		}

		const deleted = await deleteProject(id);
		if (!deleted.ok) {
			return fail(409, { message: deleted.error });
		}

		return { deleted: true };
	}
};
