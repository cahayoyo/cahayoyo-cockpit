import { fail, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { optionalId, requiredId, text } from './form-data';
import { requireUserId } from './session';
import { createTask, deleteTask, moveTaskProject, setTaskStatus, updateTask } from './tasks';
import { taskFormSchema, taskStatusSchema } from './tasks-schemas';

const idSchema = z.uuid();

// Task form actions are identical for every route that renders the task detail
// dialog (Tasks, Today): one implementation, same validation and messages —
// the taskActions counterpart of folderActions.
export const taskActions = {
	saveTask: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = taskFormSchema.safeParse({
			title: text(formData, 'title'),
			description: text(formData, 'description'),
			projectId: text(formData, 'projectId'),
			priority: text(formData, 'priority'),
			dueDate: text(formData, 'dueDate'),
			parentId: optionalId(formData, 'parentId'),
			tags: text(formData, 'tags')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid task.' });
		}

		const ownerId = requireUserId(locals);

		// No id: the dialog is creating (task or subtask); the status stays
		// server-owned and new tasks start in Backlog.
		const id = text(formData, 'id');
		if (id === '') {
			const created = await createTask(ownerId, parsed.data);
			if (!created.ok) {
				return fail(400, { message: created.error });
			}

			return { taskId: created.id };
		}

		const parsedId = idSchema.safeParse(id);
		if (!parsedId.success) {
			return fail(400, { message: 'Invalid task.' });
		}

		const updated = await updateTask(ownerId, parsedId.data, parsed.data);
		if (!updated.ok) {
			return fail(400, { message: updated.error });
		}

		return { saved: true, taskId: parsedId.data };
	},

	setTaskStatus: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const status = taskStatusSchema.safeParse(text(formData, 'status'));
		if (!id || !status.success) {
			return fail(400, { message: 'Invalid task.' });
		}

		if (!(await setTaskStatus(id, status.data))) {
			return fail(404, { message: 'This task no longer exists.' });
		}

		return { moved: true };
	},

	moveTaskProject: async ({ request }: RequestEvent) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const projectId = requiredId(formData, 'projectId');
		if (!id || !projectId) {
			return fail(400, { message: 'Invalid task.' });
		}

		const moved = await moveTaskProject(id, projectId);
		if (!moved.ok) {
			return fail(400, { message: moved.error });
		}

		return { moved: true };
	},

	deleteTask: async ({ request }: RequestEvent) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid task.' });
		}

		await deleteTask(id);
		return { deleted: true };
	}
};
