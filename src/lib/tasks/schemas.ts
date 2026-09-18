import { z } from 'zod';
import { taskPriority, taskStatus } from '$lib/server/db/schema';
import { parseTags } from '$lib/tags';

// The status is deliberately absent from the save form: it only changes through
// `setTaskStatus` (the single writer of `completed_at`); new tasks start in
// Backlog. The enum values are consumed from the schema, never re-listed.
// Server-facing module: imports the DB schema, so never import it from client code.
export const taskFormSchema = z.object({
	title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.'),
	description: z.string(),
	projectId: z.uuid(),
	priority: z.enum(taskPriority.enumValues),
	dueDate: z
		.union([z.literal(''), z.iso.date()])
		.transform((value) => (value === '' ? null : value)),
	parentId: z.uuid().nullable(),
	tags: z.string().transform(parseTags)
});

export const taskStatusSchema = z.enum(taskStatus.enumValues);

export type TaskStatus = z.infer<typeof taskStatusSchema>;

export type TaskFormInput = z.infer<typeof taskFormSchema>;

export const projectNameSchema = z
	.string()
	.trim()
	.min(1, 'Project name is required.')
	.max(100, 'Project name is too long.');
