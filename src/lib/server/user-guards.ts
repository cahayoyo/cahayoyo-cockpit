import { ADMIN_ROLE } from '$lib/roles';

export type DeactivateDecision = { ok: true } | { ok: false; message: string };

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
}): DeactivateDecision {
	if (input.targetId === input.callerId) {
		return { ok: false, message: 'You cannot deactivate your own account.' };
	}

	if (input.targetRole === ADMIN_ROLE && !input.targetBanned && input.activeAdminCount <= 1) {
		return { ok: false, message: 'The last active admin cannot be deactivated.' };
	}

	return { ok: true };
}
