import { describe, expect, test } from 'bun:test';
import { EMAIL_STATUSES } from '$lib/emails/types';
import { disposableEmailStatus } from './db/schema';

// The client-safe status list cannot be derived from the DB enum (server-only
// module), so this guard fails if a migration changes the enum without the
// client-side list.
describe('disposable email status list', () => {
	test('mirrors the disposable_email_status enum', () => {
		expect([...EMAIL_STATUSES]).toEqual([...disposableEmailStatus.enumValues]);
	});
});
