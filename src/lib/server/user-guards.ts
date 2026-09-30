import { ADMIN_ROLE } from '$lib/roles';

export type AccountDecision = { ok: true } | { ok: false; message: string };

/**
 * Pure rules for deactivating an account (spec §6): the caller cannot
 * deactivate themselves, and the last active admin cannot be deactivated.
 * A ban is redundant on an already-banned account, so it stays allowed.
 */
export function canDeactivate(input: {
	callerId: string;
	targetId: string;
	targetRole: string;
	targetBanned: boolean;
	activeAdminCount: number;
}): AccountDecision {
	if (input.targetId === input.callerId) {
		return { ok: false, message: 'You cannot deactivate your own account.' };
	}

	if (input.targetRole === ADMIN_ROLE && !input.targetBanned && input.activeAdminCount <= 1) {
		return { ok: false, message: 'The last active admin cannot be deactivated.' };
	}

	return { ok: true };
}

/**
 * Pure rules for deleting an account: the caller cannot delete themselves, and
 * the last active admin cannot be deleted — the same protections as
 * deactivation, but permanent.
 */
export function canDelete(input: {
	callerId: string;
	targetId: string;
	targetRole: string;
	targetBanned: boolean;
	activeAdminCount: number;
}): AccountDecision {
	if (input.targetId === input.callerId) {
		return { ok: false, message: 'You cannot delete your own account.' };
	}

	if (input.targetRole === ADMIN_ROLE && !input.targetBanned && input.activeAdminCount <= 1) {
		return { ok: false, message: 'The last active admin cannot be deleted.' };
	}

	return { ok: true };
}
