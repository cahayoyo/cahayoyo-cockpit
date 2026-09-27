import { describe, expect, test } from 'bun:test';
import {
	changePasswordSchema,
	createUserSchema,
	resetUserPasswordSchema,
	setUserActiveSchema
} from './account-schemas';

const USER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
// The seeded Inbox project id (version 0): not a valid RFC 9562 UUID.
const SEEDED_ID = '00000000-0000-0000-0000-000000000001';

describe('changePasswordSchema', () => {
	test('accepts a non-empty current password and an 8+ character new one', () => {
		expect(
			changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'password' }).success
		).toBe(true);
	});

	test('rejects an empty current password, a short new one, and one over the limit', () => {
		expect(
			changePasswordSchema.safeParse({ currentPassword: '', newPassword: 'password' }).success
		).toBe(false);
		expect(
			changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'short' }).success
		).toBe(false);
		expect(
			changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'a'.repeat(129) })
				.success
		).toBe(false);
	});

	test('rejects a new password equal to the current one', () => {
		expect(
			changePasswordSchema.safeParse({ currentPassword: 'password', newPassword: 'password' })
				.success
		).toBe(false);
	});
});

describe('createUserSchema', () => {
	const valid = { email: ' friend@example.com ', name: ' Friend ', password: 'password' };

	test('trims the email and name', () => {
		const parsed = createUserSchema.parse(valid);
		expect(parsed.email).toBe('friend@example.com');
		expect(parsed.name).toBe('Friend');
	});

	test('rejects a bad email, an empty name, and a short password', () => {
		expect(createUserSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
		expect(createUserSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
		expect(createUserSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
	});
});

describe('setUserActiveSchema', () => {
	test('accepts the two string flags and an optional ban reason', () => {
		expect(setUserActiveSchema.parse({ userId: USER_ID, active: 'false' })).toEqual({
			userId: USER_ID,
			active: 'false'
		});
		expect(setUserActiveSchema.safeParse({ userId: SEEDED_ID, active: 'true' }).success).toBe(true);
	});

	test('rejects a missing flag, a bad id, and an over-long ban reason', () => {
		expect(setUserActiveSchema.safeParse({ userId: USER_ID, active: '' }).success).toBe(false);
		expect(setUserActiveSchema.safeParse({ userId: 'nope', active: 'true' }).success).toBe(false);
		expect(
			setUserActiveSchema.safeParse({
				userId: USER_ID,
				active: 'false',
				banReason: 'x'.repeat(201)
			}).success
		).toBe(false);
	});
});

describe('resetUserPasswordSchema', () => {
	test('accepts a valid id and password', () => {
		expect(
			resetUserPasswordSchema.safeParse({ userId: USER_ID, newPassword: 'password' }).success
		).toBe(true);
	});

	test('rejects a malformed id and a short password', () => {
		expect(
			resetUserPasswordSchema.safeParse({ userId: 'nope', newPassword: 'password' }).success
		).toBe(false);
		expect(
			resetUserPasswordSchema.safeParse({ userId: USER_ID, newPassword: 'short' }).success
		).toBe(false);
	});
});
