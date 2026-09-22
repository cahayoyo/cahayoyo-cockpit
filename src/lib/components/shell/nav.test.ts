import { describe, expect, test } from 'bun:test';
import { currentLabel, isActivePath } from './nav';

describe('isActivePath', () => {
	test('matches the exact path', () => {
		expect(isActivePath('/bookmarks', '/bookmarks')).toBe(true);
		expect(isActivePath('/', '/')).toBe(true);
	});

	test('matches nested paths', () => {
		expect(isActivePath('/bookmarks/123', '/bookmarks')).toBe(true);
		expect(isActivePath('/tasks/kanban', '/tasks')).toBe(true);
	});

	test('does not match lookalike prefixes', () => {
		expect(isActivePath('/bookmarks-old', '/bookmarks')).toBe(false);
		expect(isActivePath('/notes2', '/notes')).toBe(false);
	});

	test('home only matches the root', () => {
		expect(isActivePath('/bookmarks', '/')).toBe(false);
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
