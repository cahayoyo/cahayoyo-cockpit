import { asc, count, eq, inArray } from 'drizzle-orm';
import {
	filterTasks,
	normalizePriorityFilter,
	normalizeStatusFilter,
	sortTasks,
	type TaskFilters
} from '$lib/tasks/filters';
import { canAssignParent, type ParentCandidate } from '$lib/tasks/subtasks';
import { todayIso } from '$lib/tasks/today';
import { groupTagNames } from '$lib/tags';
import type { Transaction } from './db';
import { db } from './db';
import { project, task, taskPriority, taskStatus, taskTag, tag } from './db/schema';
import { ensureTagIds } from './tags';
import type { TaskFormInput, TaskStatus } from './tasks-schemas';

// Fixed id seeded by migration 0001: the Inbox always exists and cannot be deleted.
export const INBOX_PROJECT_ID = '00000000-0000-0000-0000-000000000001';

export type TaskListItem = typeof task.$inferSelect & { tags: string[] };
export type ProjectListItem = typeof project.$inferSelect & {
	taskCount: number;
	isInbox: boolean;
};

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
export type WriteResult = { ok: true } | { ok: false; error: string };

async function tagsByTaskId(ids: string[]): Promise<Map<string, string[]>> {
	if (ids.length === 0) {
		return new Map();
	}

	const links = await db
		.select({ id: taskTag.taskId, name: tag.name })
		.from(taskTag)
		.innerJoin(tag, eq(taskTag.tagId, tag.id))
		.where(inArray(taskTag.taskId, ids))
		.orderBy(asc(tag.name));

	return groupTagNames(links);
}

async function withTags(rows: (typeof task.$inferSelect)[]): Promise<TaskListItem[]> {
	if (rows.length === 0) {
		return [];
	}

	const tagsByTask = await tagsByTaskId(rows.map((row) => row.id));

	return rows.map((row) => ({ ...row, tags: tagsByTask.get(row.id) ?? [] }));
}

/**
 * Tasks matching the filters, sorted, each with its tag names. Subtasks are
 * included (any level): the UI decides where they belong.
 */
export async function listTasks(filters: TaskFilters): Promise<TaskListItem[]> {
	const items = await withTags(await db.select().from(task));
	// Status and priority values are validated against the schema enums; unknown
	// URL values degrade to the defaults instead of matching nothing.
	const scope: TaskFilters = {
		...filters,
		status: normalizeStatusFilter(filters.status, taskStatus.enumValues),
		priority: normalizePriorityFilter(filters.priority, taskPriority.enumValues)
	};

	return sortTasks(filterTasks(items, scope, todayIso()), scope.sort, taskPriority.enumValues);
}

export async function getTask(id: string): Promise<TaskListItem | null> {
	const [row] = await db.select().from(task).where(eq(task.id, id));
	if (!row) {
		return null;
	}

	return { ...row, tags: (await tagsByTaskId([id])).get(id) ?? [] };
}

async function projectExists(id: string): Promise<boolean> {
	const [row] = await db.select({ id: project.id }).from(project).where(eq(project.id, id));
	return row !== undefined;
}

async function parentCandidate(id: string): Promise<ParentCandidate | null> {
	const [row] = await db
		.select({ id: task.id, parentId: task.parentId })
		.from(task)
		.where(eq(task.id, id));

	return row ?? null;
}

async function hasSubtasks(id: string): Promise<boolean> {
	const [row] = await db.select({ id: task.id }).from(task).where(eq(task.parentId, id)).limit(1);

	return row !== undefined;
}

/**
 * One-level subtask guard for create (taskId null) and update alike. Returns a
 * user-facing error, or null when the assignment is allowed.
 */
async function checkParent(taskId: string | null, parentId: string): Promise<string | null> {
	const parent = await parentCandidate(parentId);
	if (!parent) {
		return 'That parent task no longer exists.';
	}

	if (!canAssignParent(taskId, parent)) {
		return parent.id === taskId
			? 'A task cannot be its own parent.'
			: 'Subtasks cannot have subtasks.';
	}

	return null;
}

async function attachTags(tx: Transaction, taskId: string, names: string[]): Promise<void> {
	const tagIds = await ensureTagIds(tx, names);
	if (tagIds.length === 0) {
		return;
	}

	await tx.insert(taskTag).values(tagIds.map((tagId) => ({ taskId, tagId })));
}

function taskValues(input: TaskFormInput) {
	return {
		title: input.title,
		description: input.description || null,
		projectId: input.projectId,
		priority: input.priority,
		dueDate: input.dueDate,
		parentId: input.parentId
	};
}

export async function createTask(input: TaskFormInput): Promise<CreateResult> {
	if (!(await projectExists(input.projectId))) {
		return { ok: false, error: 'That project no longer exists.' };
	}

	if (input.parentId !== null) {
		const error = await checkParent(null, input.parentId);
		if (error) {
			return { ok: false, error };
		}
	}

	const id = await db.transaction(async (tx) => {
		const [row] = await tx.insert(task).values(taskValues(input)).returning({ id: task.id });
		await attachTags(tx, row.id, input.tags);
		return row.id;
	});

	return { ok: true, id };
}

// Status is not part of the save input: it only changes through setTaskStatus.
export async function updateTask(id: string, input: TaskFormInput): Promise<WriteResult> {
	const [current] = await db.select({ id: task.id }).from(task).where(eq(task.id, id));
	if (!current) {
		return { ok: false, error: 'This task no longer exists.' };
	}

	if (!(await projectExists(input.projectId))) {
		return { ok: false, error: 'That project no longer exists.' };
	}

	if (input.parentId !== null) {
		const error = await checkParent(id, input.parentId);
		if (error) {
			return { ok: false, error };
		}

		if (await hasSubtasks(id)) {
			return { ok: false, error: 'This task has subtasks, so it cannot become a subtask.' };
		}
	}

	await db.transaction(async (tx) => {
		await tx.update(task).set(taskValues(input)).where(eq(task.id, id));
		await tx.delete(taskTag).where(eq(taskTag.taskId, id));
		await attachTags(tx, id, input.tags);
	});

	return { ok: true };
}

// The single writer of completed_at: entering Done stamps it, leaving clears it.
export async function setTaskStatus(id: string, status: TaskStatus): Promise<boolean> {
	const [current] = await db
		.select({ status: task.status, completedAt: task.completedAt })
		.from(task)
		.where(eq(task.id, id));

	if (!current) {
		return false;
	}

	let completedAt = current.completedAt;
	if (status === 'done' && current.status !== 'done') {
		completedAt = new Date();
	} else if (status !== 'done' && current.status === 'done') {
		completedAt = null;
	}

	await db.update(task).set({ status, completedAt }).where(eq(task.id, id));
	return true;
}

export async function moveTaskProject(id: string, projectId: string): Promise<WriteResult> {
	if (!(await projectExists(projectId))) {
		return { ok: false, error: 'That project no longer exists.' };
	}

	const [updated] = await db
		.update(task)
		.set({ projectId })
		.where(eq(task.id, id))
		.returning({ id: task.id });

	if (!updated) {
		return { ok: false, error: 'This task no longer exists.' };
	}

	return { ok: true };
}

export async function deleteTask(id: string): Promise<void> {
	// Subtasks go with the parent via task.parent_id ON DELETE CASCADE.
	await db.delete(task).where(eq(task.id, id));
}

export async function listProjects(): Promise<ProjectListItem[]> {
	const [rows, counts] = await Promise.all([
		db.select().from(project).orderBy(asc(project.createdAt)),
		db.select({ projectId: task.projectId, value: count() }).from(task).groupBy(task.projectId)
	]);
	const countByProject = new Map(counts.map((row) => [row.projectId, row.value]));

	return rows.map((row) => ({
		...row,
		taskCount: countByProject.get(row.id) ?? 0,
		isInbox: row.id === INBOX_PROJECT_ID
	}));
}

export async function createProject(name: string): Promise<string> {
	const [row] = await db.insert(project).values({ name }).returning({ id: project.id });
	return row.id;
}

export async function renameProject(id: string, name: string): Promise<boolean> {
	const [updated] = await db
		.update(project)
		.set({ name })
		.where(eq(project.id, id))
		.returning({ id: project.id });

	return updated !== undefined;
}

export async function deleteProject(id: string): Promise<WriteResult> {
	if (id === INBOX_PROJECT_ID) {
		return { ok: false, error: 'The Inbox project cannot be deleted.' };
	}

	const [row] = await db.select({ id: project.id }).from(project).where(eq(project.id, id));
	if (!row) {
		return { ok: false, error: 'This project no longer exists.' };
	}

	const [tasks] = await db.select({ value: count() }).from(task).where(eq(task.projectId, id));
	if (tasks.value > 0) {
		return {
			ok: false,
			error: `This project still has ${tasks.value} task${tasks.value === 1 ? '' : 's'}.`
		};
	}

	await db.delete(project).where(eq(project.id, id));
	return { ok: true };
}
