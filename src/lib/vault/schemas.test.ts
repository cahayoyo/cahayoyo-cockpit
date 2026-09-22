import { describe, expect, test } from 'bun:test';
import { vaultFormSchema } from './schemas';

const valid = {
	title: 'Neon console',
	type: 'login',
	username: 'owner@cahayoyo.dev',
	secret: 's3cret-value',
	url: 'https://console.neon.tech',
	notes: '',
	tags: 'database, neon'
};

describe('vaultFormSchema', () => {
	test('accepts a full login and transforms the tag string', () => {
		const parsed = vaultFormSchema.safeParse(valid);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.tags).toEqual(['database', 'neon']);
			expect(parsed.data.secret).toBe('s3cret-value');
		}
	});

	test('requires a username for logins only', () => {
		expect(vaultFormSchema.safeParse({ ...valid, username: '' }).success).toBe(false);
		expect(vaultFormSchema.safeParse({ ...valid, username: '   ' }).success).toBe(false);
		expect(vaultFormSchema.safeParse({ ...valid, type: 'api_key', username: '' }).success).toBe(
			true
		);
		expect(vaultFormSchema.safeParse({ ...valid, type: 'note', username: '' }).success).toBe(true);
	});

	test('requires a title and a secret for every type', () => {
		expect(vaultFormSchema.safeParse({ ...valid, title: '   ' }).success).toBe(false);
		expect(vaultFormSchema.safeParse({ ...valid, secret: '' }).success).toBe(false);
		expect(
			vaultFormSchema.safeParse({ ...valid, type: 'note', username: '', secret: '' }).success
		).toBe(false);
	});

	test('accepts blank optional url and notes', () => {
		const parsed = vaultFormSchema.safeParse({ ...valid, url: '', notes: '' });
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.url).toBe('');
			expect(parsed.data.notes).toBe('');
		}
	});

	test('rejects an unknown type', () => {
		expect(vaultFormSchema.safeParse({ ...valid, type: 'ssh_key' }).success).toBe(false);
	});
});
