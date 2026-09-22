import type { TaskFormInput, TaskStatus } from '$lib/server/tasks-schemas';

// Client-safe display metadata for the task enums. The schema owns the values
// (server-only); the `Record<…>` types below make the compiler fail when an
// enum gains a value, so the UI can never silently miss one.
export type TaskPriority = TaskFormInput['priority'];
export type { TaskStatus };

export const STATUS_META: Record<TaskStatus, { label: string; badge: string; dot: string }> = {
	backlog: {
		label: 'Backlog',
		badge: 'border-muted-foreground/30 bg-muted text-muted-foreground',
		dot: 'bg-muted-foreground/60'
	},
	in_progress: {
		label: 'In Progress',
		badge: 'border-info/30 bg-info/10 text-info',
		dot: 'bg-info'
	},
	review: {
		label: 'Review',
		badge: 'border-violet/30 bg-violet/10 text-violet',
		dot: 'bg-violet'
	},
	waiting_for_acceptance: {
		label: 'Waiting For Acceptance',
		badge: 'border-warning/30 bg-warning/10 text-warning',
		dot: 'bg-warning'
	},
	waiting_for_deployment: {
		label: 'Waiting For Deployment',
		badge: 'border-teal/30 bg-teal/10 text-teal',
		dot: 'bg-teal'
	},
	done: {
		label: 'Done',
		badge: 'border-success/30 bg-success/10 text-success',
		dot: 'bg-success'
	}
};

// Workflow order, left to right on the kanban board and in the status select.
export const STATUS_ORDER: readonly TaskStatus[] = [
	'backlog',
	'in_progress',
	'review',
	'waiting_for_acceptance',
	'waiting_for_deployment',
	'done'
];

export const PRIORITY_META: Record<TaskPriority, { label: string; badge: string }> = {
	low: { label: 'Low', badge: 'border-muted-foreground/30 bg-muted text-muted-foreground' },
	medium: { label: 'Medium', badge: 'border-info/30 bg-info/10 text-info' },
	high: { label: 'High', badge: 'border-warning/30 bg-warning/10 text-warning' },
	urgent: { label: 'Urgent', badge: 'border-destructive/30 bg-destructive/10 text-destructive' }
};

export const PRIORITY_ORDER: readonly TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function projectName(projects: readonly { id: string; name: string }[], id: string): string {
	return projects.find((project) => project.id === id)?.name ?? '';
}

/** Shared ConfirmDialog copy: a parent deletes its subtasks with it. */
export function deleteTaskDescription(task: { title: string; parentId: string | null }): string {
	return `"${task.title || 'Untitled'}" will be deleted${
		task.parentId === null ? ', together with its subtasks' : ''
	}.`;
}
