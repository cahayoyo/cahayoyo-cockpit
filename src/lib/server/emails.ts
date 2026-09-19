import { asc, desc, eq, isNotNull } from 'drizzle-orm';
import type { EmailFormInput } from '$lib/emails/schemas';
import type { EmailStatus } from '$lib/emails/types';
import { db } from './db';
import { disposableEmail, task } from './db/schema';

export type EmailListItem = typeof disposableEmail.$inferSelect & { taskTitle: string | null };

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };
export type WriteResult = { ok: true } | { ok: false; error: string };

/** Every recorded address with its linked task title (null when unlinked). */
export async function listEmails(): Promise<EmailListItem[]> {
	const rows = await db
		.select({ email: disposableEmail, taskTitle: task.title })
		.from(disposableEmail)
		.leftJoin(task, eq(disposableEmail.taskId, task.id))
		.orderBy(desc(disposableEmail.createdAt));

	return rows.map((row) => ({ ...row.email, taskTitle: row.taskTitle }));
}

async function taskExists(id: string): Promise<boolean> {
	const [row] = await db.select({ id: task.id }).from(task).where(eq(task.id, id));
	return row !== undefined;
}

function emailValues(input: EmailFormInput) {
	return {
		address: input.address,
		provider: input.provider || null,
		purpose: input.purpose || null,
		taskId: input.taskId,
		status: input.status,
		notes: input.notes || null
	};
}

export async function createEmail(input: EmailFormInput): Promise<CreateResult> {
	if (input.taskId !== null && !(await taskExists(input.taskId))) {
		return { ok: false, error: 'That task no longer exists.' };
	}

	const [row] = await db
		.insert(disposableEmail)
		.values(emailValues(input))
		.returning({ id: disposableEmail.id });

	return { ok: true, id: row.id };
}

export async function updateEmail(id: string, input: EmailFormInput): Promise<WriteResult> {
	const [current] = await db
		.select({ id: disposableEmail.id })
		.from(disposableEmail)
		.where(eq(disposableEmail.id, id));

	if (!current) {
		return { ok: false, error: 'This address no longer exists.' };
	}

	if (input.taskId !== null && !(await taskExists(input.taskId))) {
		return { ok: false, error: 'That task no longer exists.' };
	}

	await db.update(disposableEmail).set(emailValues(input)).where(eq(disposableEmail.id, id));
	return { ok: true };
}

export async function setEmailStatus(id: string, status: EmailStatus): Promise<boolean> {
	const [updated] = await db
		.update(disposableEmail)
		.set({ status })
		.where(eq(disposableEmail.id, id))
		.returning({ id: disposableEmail.id });

	return updated !== undefined;
}

export async function deleteEmail(id: string): Promise<void> {
	await db.delete(disposableEmail).where(eq(disposableEmail.id, id));
}

/** Distinct provider values already recorded, for the datalist and the filter. */
export async function listEmailProviders(): Promise<string[]> {
	const rows = await db
		.selectDistinct({ provider: disposableEmail.provider })
		.from(disposableEmail)
		.where(isNotNull(disposableEmail.provider))
		.orderBy(asc(disposableEmail.provider));

	return rows
		.map((row) => row.provider)
		.filter((provider): provider is string => provider !== null && provider !== '');
}
