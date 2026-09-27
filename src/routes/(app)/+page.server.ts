import { fail } from '@sveltejs/kit';
import { listBookmarks } from '$lib/server/bookmarks';
import { text } from '$lib/server/form-data';
import { listNotes } from '$lib/server/notes';
import { requireUserId } from '$lib/server/session';
import { createTask, getInboxProjectId, listTasks } from '$lib/server/tasks';
import { taskFormSchema } from '$lib/server/tasks-schemas';
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

export const actions: Actions = {
	// Quick add, same shape as /today: title only, straight to Inbox in Backlog,
	// due today so the task lands in the Today widget right after the submit.
	quickAdd: async ({ request, locals }) => {
		const ownerId = requireUserId(locals);
		const inboxId = await getInboxProjectId(ownerId);
		if (!inboxId) {
			return fail(400, { message: 'No Inbox project found.' });
		}

		const parsed = taskFormSchema.safeParse({
			title: text(await request.formData(), 'title'),
			description: '',
			projectId: inboxId,
			priority: 'medium',
			dueDate: todayIso(),
			parentId: null,
			tags: ''
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid task.' });
		}

		const created = await createTask(ownerId, parsed.data);
		if (!created.ok) {
			return fail(400, { message: created.error });
		}

		return { taskId: created.id };
	}
};
