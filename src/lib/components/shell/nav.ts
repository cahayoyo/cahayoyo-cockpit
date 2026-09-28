import Bookmark from '@lucide/svelte/icons/bookmark';
import CalendarCheck from '@lucide/svelte/icons/calendar-check';
import Lock from '@lucide/svelte/icons/lock';
import Mail from '@lucide/svelte/icons/mail';
import NotebookPen from '@lucide/svelte/icons/notebook-pen';
import Plane from '@lucide/svelte/icons/plane';
import Settings from '@lucide/svelte/icons/settings';
import SquareCheckBig from '@lucide/svelte/icons/square-check-big';
import Users from '@lucide/svelte/icons/users';
import Wrench from '@lucide/svelte/icons/wrench';
import { ADMIN_ROLE } from '$lib/roles';

export const NAV_ITEMS = [
	{ href: '/', label: 'Cockpit', icon: Plane },
	{ href: '/today', label: 'Today', icon: CalendarCheck },
	{ href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
	{ href: '/notes', label: 'Notes', icon: NotebookPen },
	{ href: '/tasks', label: 'Tasks', icon: SquareCheckBig },
	{ href: '/toolkit', label: 'Toolkit', icon: Wrench },
	{ href: '/emails', label: 'Emails', icon: Mail },
	{ href: '/vault', label: 'Vault', icon: Lock },
	{ href: '/users', label: 'Users', icon: Users, adminOnly: true },
	{ href: '/settings', label: 'Settings', icon: Settings }
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

/**
 * Nav entries the signed-in role may see. The super admin owns account
 * management; everyone else never gets the link. This only hides the entry —
 * the route itself refuses a non-admin server-side (`requireAdmin`).
 */
export function visibleNavItems(role: string | null | undefined): readonly NavItem[] {
	return NAV_ITEMS.filter((item) => !('adminOnly' in item) || role === ADMIN_ROLE);
}

export function isActivePath(path: string, href: string): boolean {
	return path === href || (href !== '/' && path.startsWith(`${href}/`));
}

export function currentLabel(path: string): string {
	return NAV_ITEMS.find((item) => isActivePath(path, item.href))?.label ?? NAV_ITEMS[0].label;
}
