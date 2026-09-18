import { z } from 'zod';
import { DUE_KEYS, SORT_KEYS, type TaskFilters } from './filters';

export const taskSearchSchema = z.object({
	project: z.uuid().catch(''),
	status: z.string().trim().toLowerCase().catch('active'),
	priority: z.string().trim().toLowerCase().catch('all'),
	tag: z.string().trim().toLowerCase().catch(''),
	due: z.enum(DUE_KEYS).catch('any'),
	q: z.string().trim().catch(''),
	sort: z.enum(SORT_KEYS).catch('due'),
	task: z.uuid().catch('')
});

export type TaskSearch = TaskFilters & { taskId: string | null };

// Unknown or malformed params degrade to the safe default: all projects, Active
// status, no other filters, due-date sort, no open task. Status/priority values
// are validated against the schema enum by the server when the list is queried.
export function parseTaskSearch(params: URLSearchParams): TaskSearch {
	const parsed = taskSearchSchema.parse({
		project: params.get('project') ?? '',
		status: params.get('status') ?? 'active',
		priority: params.get('priority') ?? 'all',
		tag: params.get('tag') ?? '',
		due: params.get('due') ?? 'any',
		q: params.get('q') ?? '',
		sort: params.get('sort') ?? 'due',
		task: params.get('task') ?? ''
	});

	return {
		projectId: parsed.project || null,
		status: parsed.status,
		priority: parsed.priority,
		tag: parsed.tag || null,
		due: parsed.due,
		q: parsed.q,
		sort: parsed.sort,
		taskId: parsed.task || null
	};
}

export const taskViewSchema = z.enum(['list', 'kanban']).catch('list');

export type TaskView = z.infer<typeof taskViewSchema>;

// Kanban only makes sense with a specific project selected; the page enforces
// that, the parser just keeps the view well-formed.
export function parseTaskView(params: URLSearchParams): TaskView {
	return taskViewSchema.parse(params.get('view') ?? 'list');
}

// Inverse of parseTaskSearch plus the view: the canonical query string for the
// page state. Default values are omitted, so a default state produces an empty
// string.
export function buildTaskSearch(search: TaskSearch, view: TaskView): string {
	const parts: string[] = [];
	if (search.projectId) parts.push(`project=${search.projectId}`);
	if (search.status !== 'active') parts.push(`status=${encodeURIComponent(search.status)}`);
	if (search.priority !== 'all') parts.push(`priority=${encodeURIComponent(search.priority)}`);
	if (search.tag) parts.push(`tag=${encodeURIComponent(search.tag)}`);
	if (search.due !== 'any') parts.push(`due=${search.due}`);
	if (search.q) parts.push(`q=${encodeURIComponent(search.q)}`);
	if (search.sort !== 'due') parts.push(`sort=${search.sort}`);
	if (view === 'kanban') parts.push('view=kanban');
	if (search.taskId) parts.push(`task=${search.taskId}`);

	return parts.join('&');
}
