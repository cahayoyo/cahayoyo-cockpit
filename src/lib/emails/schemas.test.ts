import { describe, expect, test } from 'bun:test';
import { emailFormSchema } from './schemas';

const valid = {
	address: 'qa.checkout.8841@mail.tm',
	provider: 'mail.tm',
	purpose: 'Checkout retry verification',
	taskId: null,
	status: 'active',
	notes: ''
};

describe('emailFormSchema', () => {
	test('accepts a full record', () => {
		const parsed = emailFormSchema.safeParse({ ...valid, notes: 'Staging only.' });
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.address).toBe('qa.checkout.8841@mail.tm');
			expect(parsed.data.notes).toBe('Staging only.');
		}
	});

	test('accepts blank optional fields and the dead status', () => {
		const parsed = emailFormSchema.safeParse({
			...valid,
			provider: '',
			purpose: '',
			status: 'dead'
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.provider).toBe('');
			expect(parsed.data.status).toBe('dead');
		}
	});

	test('trims the address and optional text', () => {
		const parsed = emailFormSchema.safeParse({
			...valid,
			address: '  a@b.com  ',
			provider: ' mail.tm '
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.address).toBe('a@b.com');
			expect(parsed.data.provider).toBe('mail.tm');
		}
	});

	test('rejects a blank address', () => {
		expect(emailFormSchema.safeParse({ ...valid, address: '   ' }).success).toBe(false);
	});

	test('rejects an unknown status', () => {
		expect(emailFormSchema.safeParse({ ...valid, status: 'expired' }).success).toBe(false);
	});

	test('rejects a malformed task id', () => {
		expect(emailFormSchema.safeParse({ ...valid, taskId: 'not-an-id' }).success).toBe(false);
	});

	test('accepts the seeded Inbox-style guid as a task id', () => {
		const parsed = emailFormSchema.safeParse({
			...valid,
			taskId: '00000000-0000-0000-0000-000000000001'
		});
		expect(parsed.success).toBe(true);
	});
});
