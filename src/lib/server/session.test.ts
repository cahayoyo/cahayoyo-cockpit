import { describe, expect, test } from 'bun:test';
import { requireAdmin, requireUserId } from './session';

function locals(user?: { id: string; role: string }): App.Locals {
	return { user } as unknown as App.Locals;
}

function statusOf(run: () => unknown): number {
	try {
		run();
	} catch (error) {
		return (error as { status?: number }).status ?? 0;
	}
	return 0;
}

describe('requireAdmin', () => {
	test('returns the signed-in admin id', () => {
		expect(requireAdmin(locals({ id: 'admin-1', role: 'admin' }))).toBe('admin-1');
	});

	test('rejects a non-admin with 403', () => {
		expect(statusOf(() => requireAdmin(locals({ id: 'user-1', role: 'user' })))).toBe(403);
	});

	test('rejects a signed-out caller with 401', () => {
		expect(statusOf(() => requireAdmin(locals()))).toBe(401);
	});
});

describe('requireUserId', () => {
	test('returns the signed-in id and rejects a signed-out caller', () => {
		expect(requireUserId(locals({ id: 'user-1', role: 'user' }))).toBe('user-1');
		expect(statusOf(() => requireUserId(locals()))).toBe(401);
	});
});
