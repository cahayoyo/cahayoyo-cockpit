import type { DueFilter, SortKey } from '$lib/tasks/filters.js';
import type { TaskPriority, TaskStatus } from '$lib/tasks/presentation.js';

// View model the pages hand to the task components. The server layer returns
// rows that structurally satisfy these shapes.
export type TaskItem = {
	id: string;
	title: string;
	description: string | null;
	projectId: string;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
	parentId: string | null;
	completedAt: Date | null;
	createdAt: Date;
	tags: string[];
};

export type ProjectItem = {
	id: string;
	name: string;
	taskCount: number;
	isInbox: boolean;
};

export type TaskProgress = { done: number; total: number };

// URL-filter patch: omitted keys keep their current value, `null` clears the
// filter (same convention as the bookmarks toolbar). `view` switches the
// list/kanban toggle.
export type TaskFilterPatch = {
	projectId?: string | null;
	status?: string;
	priority?: string;
	tag?: string | null;
	due?: DueFilter;
	sort?: SortKey;
	q?: string;
	taskId?: string | null;
	view?: 'list' | 'kanban';
};
