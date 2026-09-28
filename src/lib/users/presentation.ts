import type { BadgeVariant } from '$lib/components/ui/badge/index.js';
import { ADMIN_ROLE } from '$lib/roles';

// Account list labels (#89). Pure, so the users table and the action dialogs
// never drift on wording; `admin` is the super admin role (spec §6).

/** Display name for an account role. */
export function roleLabel(role: string): string {
	return role === ADMIN_ROLE ? 'Super admin' : 'User';
}

/** Account status wording; deactivation is a ban, never a delete. */
export function statusLabel(banned: boolean): string {
	return banned ? 'Deactivated' : 'Active';
}

/** Badge variant for the status cell — the label carries the meaning, the tint does not. */
export function statusVariant(banned: boolean): BadgeVariant {
	return banned ? 'outline' : 'secondary';
}
