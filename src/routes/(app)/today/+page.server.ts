import { fail } from '@sveltejs/kit';
import type { TaskFilters } from '$lib/tasks/filters';
import { todayIso } from '$lib/tasks/today';
import { taskActions } from '$lib/server/task-actions';
import { text } from '$lib/server/form-data';
import { INBOX_PROJECT_ID } from '$lib/ids';
import { createTask, listProjects, listTasks } from '$lib/server/tasks';
import { taskFormSchema } from '$lib/server/tasks-schemas';
import { listTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

// The page derives the Today scope from one unfiltered task list: a subtask's
// parent is usually not due today, but the row still needs its label.
const ALL_TASKS: TaskFilters = {
	projectId: null,
	status: 'all',
	priority: 'all',
	tag: null,
	due: 'any',
	q: '',
	sort: 'due'
};

export const load: PageServerLoad = async () => {
	const [projects, tasks, tags] = await Promise.all([
		listProjects(),
		listTasks(ALL_TASKS),
		listTags()
	]);

	return { projects, tasks, tags, today: todayIso() };
};

export const actions: Actions = {
	...taskActions,

	// Quick add: title only, straight to Inbox in Backlog, due today.
	quickAdd: async ({ request }) => {
		const parsed = taskFormSchema.safeParse({
			title: text(await request.formData(), 'title'),
			description: '',
			projectId: INBOX_PROJECT_ID,
			priority: 'medium',
			dueDate: todayIso(),
			parentId: null,
			tags: ''
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid task.' });
		}

		const created = await createTask(parsed.data);
		if (!created.ok) {
			return fail(400, { message: created.error });
		}

		return { taskId: created.id };
	}
};
