import { and, asc, count, eq, inArray } from 'drizzle-orm';
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

export type TaskListItem = typeof task.$inferSelect & { tags: string[] };
export type ProjectListItem = typeof project.$inferSelect & {
	taskCount: number;
	isInbox: boolean;
};

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
export type WriteResult =
	{ ok: true } | { ok: false; reason: 'missing' | 'invalid'; error: string };

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
export async function listTasks(ownerId: string, filters: TaskFilters): Promise<TaskListItem[]> {
	const items = await withTags(await db.select().from(task).where(eq(task.ownerId, ownerId)));
	// Status and priority values are validated against the schema enums; unknown
	// URL values degrade to the defaults instead of matching nothing.
	const scope: TaskFilters = {
		...filters,
		status: normalizeStatusFilter(filters.status, taskStatus.enumValues),
		priority: normalizePriorityFilter(filters.priority, taskPriority.enumValues)
	};

	return sortTasks(filterTasks(items, scope, todayIso()), scope.sort, taskPriority.enumValues);
}

export async function getTask(ownerId: string, id: string): Promise<TaskListItem | null> {
	const [row] = await db
		.select()
		.from(task)
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)));

	if (!row) {
		return null;
	}

	return { ...row, tags: (await tagsByTaskId([id])).get(id) ?? [] };
}

async function projectExists(ownerId: string, id: string): Promise<boolean> {
	const [row] = await db
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.id, id), eq(project.ownerId, ownerId)));

	return row !== undefined;
}

async function parentCandidate(ownerId: string, id: string): Promise<ParentCandidate | null> {
	const [row] = await db
		.select({ id: task.id, parentId: task.parentId })
		.from(task)
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)));

	return row ?? null;
}

async function hasSubtasks(ownerId: string, id: string): Promise<boolean> {
	const [row] = await db
		.select({ id: task.id })
		.from(task)
		.where(and(eq(task.parentId, id), eq(task.ownerId, ownerId)))
		.limit(1);

	return row !== undefined;
}

/**
 * One-level subtask guard for create (taskId null) and update alike. Returns a
 * user-facing error, or null when the assignment is allowed.
 */
async function checkParent(
	ownerId: string,
	taskId: string | null,
	parentId: string
): Promise<string | null> {
	const parent = await parentCandidate(ownerId, parentId);
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

async function attachTags(
	tx: Transaction,
	ownerId: string,
	taskId: string,
	names: string[]
): Promise<void> {
	const tagIds = await ensureTagIds(tx, ownerId, names);
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

export async function createTask(ownerId: string, input: TaskFormInput): Promise<CreateResult> {
	if (!(await projectExists(ownerId, input.projectId))) {
		return { ok: false, error: 'That project no longer exists.' };
	}

	if (input.parentId !== null) {
		const error = await checkParent(ownerId, null, input.parentId);
		if (error) {
			return { ok: false, error };
		}
	}

	const id = await db.transaction(async (tx) => {
		const [row] = await tx
			.insert(task)
			.values({ ...taskValues(input), ownerId })
			.returning({ id: task.id });
		await attachTags(tx, ownerId, row.id, input.tags);
		return row.id;
	});

	return { ok: true, id };
}

// Status is not part of the save input: it only changes through setTaskStatus.
export async function updateTask(
	ownerId: string,
	id: string,
	input: TaskFormInput
): Promise<WriteResult> {
	const [current] = await db
		.select({ id: task.id })
		.from(task)
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)));

	if (!current) {
		return { ok: false, reason: 'missing', error: 'This task no longer exists.' };
	}

	if (!(await projectExists(ownerId, input.projectId))) {
		return { ok: false, reason: 'invalid', error: 'That project no longer exists.' };
	}

	if (input.parentId !== null) {
		const error = await checkParent(ownerId, id, input.parentId);
		if (error) {
			return { ok: false, reason: 'invalid', error };
		}

		if (await hasSubtasks(ownerId, id)) {
			return {
				ok: false,
				reason: 'invalid',
				error: 'This task has subtasks, so it cannot become a subtask.'
			};
		}
	}

	await db.transaction(async (tx) => {
		await tx.update(task).set(taskValues(input)).where(eq(task.id, id));
		await tx.delete(taskTag).where(eq(taskTag.taskId, id));
		await attachTags(tx, ownerId, id, input.tags);
	});

	return { ok: true };
}

// The single writer of completed_at: entering Done stamps it, leaving clears it.
export async function setTaskStatus(
	ownerId: string,
	id: string,
	status: TaskStatus
): Promise<boolean> {
	const [current] = await db
		.select({ status: task.status, completedAt: task.completedAt })
		.from(task)
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)));

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

export async function moveTaskProject(
	ownerId: string,
	id: string,
	projectId: string
): Promise<WriteResult> {
	if (!(await projectExists(ownerId, projectId))) {
		return { ok: false, reason: 'invalid', error: 'That project no longer exists.' };
	}

	const [updated] = await db
		.update(task)
		.set({ projectId })
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)))
		.returning({ id: task.id });

	if (!updated) {
		return { ok: false, reason: 'missing', error: 'This task no longer exists.' };
	}

	return { ok: true };
}

export async function deleteTask(ownerId: string, id: string): Promise<boolean> {
	// Subtasks go with the parent via task.parent_id ON DELETE CASCADE.
	const [deleted] = await db
		.delete(task)
		.where(and(eq(task.id, id), eq(task.ownerId, ownerId)))
		.returning({ id: task.id });

	return deleted !== undefined;
}

export async function listProjects(ownerId: string): Promise<ProjectListItem[]> {
	const [rows, counts] = await Promise.all([
		db.select().from(project).where(eq(project.ownerId, ownerId)).orderBy(asc(project.createdAt)),
		db
			.select({ projectId: task.projectId, value: count() })
			.from(task)
			.where(eq(task.ownerId, ownerId))
			.groupBy(task.projectId)
	]);
	const countByProject = new Map(counts.map((row) => [row.projectId, row.value]));

	return rows.map((row) => ({
		...row,
		taskCount: countByProject.get(row.id) ?? 0,
		isInbox: row.isInbox
	}));
}

/** The signed-in account's Inbox project id (each account has exactly one). */
export async function getInboxProjectId(ownerId: string): Promise<string | null> {
	const [row] = await db
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.ownerId, ownerId), eq(project.isInbox, true)));

	return row?.id ?? null;
}

export async function createProject(ownerId: string, name: string): Promise<string> {
	const [row] = await db.insert(project).values({ name, ownerId }).returning({ id: project.id });
	return row.id;
}

export async function renameProject(ownerId: string, id: string, name: string): Promise<boolean> {
	const [updated] = await db
		.update(project)
		.set({ name })
		.where(and(eq(project.id, id), eq(project.ownerId, ownerId)))
		.returning({ id: project.id });

	return updated !== undefined;
}

export async function deleteProject(ownerId: string, id: string): Promise<WriteResult> {
	const [row] = await db
		.select({ id: project.id, isInbox: project.isInbox })
		.from(project)
		.where(and(eq(project.id, id), eq(project.ownerId, ownerId)));

	if (!row) {
		return { ok: false, reason: 'missing', error: 'This project no longer exists.' };
	}

	if (row.isInbox) {
		return { ok: false, reason: 'invalid', error: 'The Inbox project cannot be deleted.' };
	}

	const [tasks] = await db
		.select({ value: count() })
		.from(task)
		.where(and(eq(task.projectId, id), eq(task.ownerId, ownerId)));

	if (tasks.value > 0) {
		return {
			ok: false,
			reason: 'invalid',
			error: `This project still has ${tasks.value} task${tasks.value === 1 ? '' : 's'}.`
		};
	}

	await db.delete(project).where(and(eq(project.id, id), eq(project.ownerId, ownerId)));
	return { ok: true };
}
