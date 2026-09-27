import type { RequestEvent } from '@sveltejs/kit';
import { and, count, eq } from 'drizzle-orm';
import { auth } from './auth';
import { db } from './db';
import { project, user } from './db/schema';
import { requireAdmin } from './session';
import { canDeactivate } from './user-guards';

export type AccountListItem = {
	id: string;
	email: string;
	name: string;
	role: string;
	banned: boolean;
	createdAt: Date;
};

export type AccountWriteResult =
	{ ok: true } | { ok: false; reason: 'missing' | 'refused'; message: string };

type AuthUserRow = {
	id: string;
	email: string;
	name: string;
	role?: string | null;
	banned?: boolean | null;
	createdAt: Date | string;
};

function toListItem(row: AuthUserRow): AccountListItem {
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		role: row.role ?? 'user',
		banned: row.banned ?? false,
		createdAt: new Date(row.createdAt)
	};
}

async function findAccount(id: string): Promise<{ role: string; banned: boolean } | null> {
	const [row] = await db
		.select({ role: user.role, banned: user.banned })
		.from(user)
		.where(eq(user.id, id));

	return row ?? null;
}

async function activeAdminCount(): Promise<number> {
	const [row] = await db
		.select({ value: count() })
		.from(user)
		.where(and(eq(user.role, 'admin'), eq(user.banned, false)));

	return row.value;
}

/** All accounts, newest first (spec §6). Super admin only. */
export async function listUsers(event: RequestEvent): Promise<AccountListItem[]> {
	requireAdmin(event.locals);
	const result = await auth.api.listUsers({
		headers: event.request.headers,
		query: { limit: 200, sortBy: 'createdAt', sortDirection: 'desc' }
	});

	return result.users.map(toListItem);
}

export type CreateUserInput = { email: string; name: string; password: string };

/**
 * Create an account with a credential password (spec §6): role `user`,
 * verified email, and its own Inbox. Super admin only.
 */
export async function createUser(
	event: RequestEvent,
	input: CreateUserInput
): Promise<AccountListItem> {
	requireAdmin(event.locals);
	const result = await auth.api.createUser({
		headers: event.request.headers,
		body: {
			email: input.email,
			name: input.name,
			password: input.password,
			role: 'user',
			// Admin-created accounts skip the (disabled) public verification flow.
			data: { emailVerified: true }
		}
	});
	await ensureInbox(result.user.id);

	return toListItem(result.user);
}

export type SetUserActiveInput = { userId: string; active: boolean; banReason?: string };

/**
 * Deactivate (ban) or reactivate (unban) an account (spec §6). Banning revokes
 * the target's sessions; the self-deactivation and last-active-admin rules are
 * enforced before any write.
 */
export async function setUserActive(
	event: RequestEvent,
	input: SetUserActiveInput
): Promise<AccountWriteResult> {
	const callerId = requireAdmin(event.locals);
	const target = await findAccount(input.userId);
	if (!target) {
		return { ok: false, reason: 'missing', message: 'That account no longer exists.' };
	}

	if (input.active) {
		await auth.api.unbanUser({ body: { userId: input.userId }, headers: event.request.headers });
		return { ok: true };
	}

	const decision = canDeactivate({
		callerId,
		targetId: input.userId,
		targetRole: target.role,
		targetBanned: target.banned,
		activeAdminCount: await activeAdminCount()
	});
	if (!decision.ok) {
		return { ok: false, reason: 'refused', message: decision.message };
	}

	await auth.api.banUser({
		body: { userId: input.userId, banReason: input.banReason },
		headers: event.request.headers
	});

	return { ok: true };
}

/**
 * Reset another account's password (spec §6). `setUserPassword` does not touch
 * sessions (plugin caveat), so the target's sessions are revoked right after —
 * the old password's sessions must not outlive the reset.
 */
export async function resetUserPassword(
	event: RequestEvent,
	input: { userId: string; newPassword: string }
): Promise<AccountWriteResult> {
	requireAdmin(event.locals);
	if (!(await findAccount(input.userId))) {
		return { ok: false, reason: 'missing', message: 'That account no longer exists.' };
	}

	await auth.api.setUserPassword({
		body: { userId: input.userId, newPassword: input.newPassword },
		headers: event.request.headers
	});
	await auth.api.revokeUserSessions({
		body: { userId: input.userId },
		headers: event.request.headers
	});

	return { ok: true };
}

/** One Inbox per account (ADR-0005); idempotent. */
export async function ensureInbox(ownerId: string): Promise<void> {
	const [existing] = await db
		.select({ id: project.id })
		.from(project)
		.where(and(eq(project.ownerId, ownerId), eq(project.isInbox, true)))
		.limit(1);
	if (existing) {
		return;
	}

	await db.insert(project).values({ ownerId, name: 'Inbox', isInbox: true });
}
