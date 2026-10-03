import { describe, expect, test } from 'bun:test';
import { currentLabel, isActivePath, visibleNavItems } from './nav';

describe('isActivePath', () => {
	test('matches the exact path', () => {
		expect(isActivePath('/emails', '/emails')).toBe(true);
		expect(isActivePath('/', '/')).toBe(true);
	});

	test('matches nested paths', () => {
		expect(isActivePath('/emails/123', '/emails')).toBe(true);
		expect(isActivePath('/tasks/kanban', '/tasks')).toBe(true);
	});

	test('does not match lookalike prefixes', () => {
		expect(isActivePath('/emails-old', '/emails')).toBe(false);
		expect(isActivePath('/notes2', '/notes')).toBe(false);
	});

	test('home only matches the root', () => {
		expect(isActivePath('/emails', '/')).toBe(false);
	});
});

describe('currentLabel', () => {
	test('resolves the active section, including nested paths', () => {
		expect(currentLabel('/')).toBe('Cockpit');
		expect(currentLabel('/vault/items')).toBe('Vault');
	});

	test('falls back to Home for unknown paths', () => {
		expect(currentLabel('/nope')).toBe('Cockpit');
	});
});

describe('visibleNavItems', () => {
	test('hides admin-only entries from regular accounts and signed-out roles', () => {
		expect(visibleNavItems('user').some((item) => item.href === '/users')).toBe(false);
		expect(visibleNavItems(null).some((item) => item.href === '/users')).toBe(false);
	});

	test('shows admin-only entries to the super admin', () => {
		expect(visibleNavItems('admin').some((item) => item.href === '/users')).toBe(true);
	});

	test('keeps every shared entry for any role', () => {
		expect(visibleNavItems('user').some((item) => item.href === '/settings')).toBe(true);
		expect(visibleNavItems('admin').length).toBe(visibleNavItems('user').length + 1);
	});
});
