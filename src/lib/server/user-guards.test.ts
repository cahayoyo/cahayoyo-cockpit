import { describe, expect, test } from 'bun:test';
import { canDeactivate, canDelete } from './user-guards';

const base = {
	callerId: 'admin-1',
	targetId: 'user-1',
	targetRole: 'user',
	targetBanned: false,
	activeAdminCount: 1
};

describe('canDeactivate', () => {
	test('allows deactivating a regular account', () => {
		expect(canDeactivate(base)).toEqual({ ok: true });
	});

	test('refuses self-deactivation', () => {
		expect(canDeactivate({ ...base, targetId: 'admin-1', targetRole: 'admin' })).toEqual({
			ok: false,
			message: 'You cannot deactivate your own account.'
		});
	});

	test('refuses the last active admin', () => {
		expect(canDeactivate({ ...base, targetId: 'admin-2', targetRole: 'admin' })).toEqual({
			ok: false,
			message: 'The last active admin cannot be deactivated.'
		});
	});

	test('allows an admin when another active admin remains', () => {
		expect(
			canDeactivate({ ...base, targetId: 'admin-2', targetRole: 'admin', activeAdminCount: 2 })
		).toEqual({ ok: true });
	});

	test('allows re-banning an already banned admin', () => {
		expect(
			canDeactivate({ ...base, targetId: 'admin-2', targetRole: 'admin', targetBanned: true })
		).toEqual({ ok: true });
	});
});

describe('canDelete', () => {
	test('allows deleting a regular account', () => {
		expect(canDelete(base)).toEqual({ ok: true });
	});

	test('refuses self-deletion', () => {
		expect(canDelete({ ...base, targetId: 'admin-1', targetRole: 'admin' })).toEqual({
			ok: false,
			message: 'You cannot delete your own account.'
		});
	});

	test('refuses the last active admin', () => {
		expect(canDelete({ ...base, targetId: 'admin-2', targetRole: 'admin' })).toEqual({
			ok: false,
			message: 'The last active admin cannot be deleted.'
		});
	});

	test('allows an admin when another active admin remains', () => {
		expect(
			canDelete({ ...base, targetId: 'admin-2', targetRole: 'admin', activeAdminCount: 2 })
		).toEqual({ ok: true });
	});

	test('allows deleting an already banned admin', () => {
		expect(
			canDelete({ ...base, targetId: 'admin-2', targetRole: 'admin', targetBanned: true })
		).toEqual({ ok: true });
	});
});
