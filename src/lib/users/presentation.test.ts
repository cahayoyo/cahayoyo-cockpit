import { describe, expect, test } from 'bun:test';
import { roleLabel, statusLabel, statusVariant } from './presentation';

describe('roleLabel', () => {
	test('names the super admin role', () => {
		expect(roleLabel('admin')).toBe('Super admin');
	});

	test('falls back to User for every other role', () => {
		expect(roleLabel('user')).toBe('User');
		expect(roleLabel('whatever')).toBe('User');
	});
});

describe('statusLabel', () => {
	test('maps the ban flag to account wording', () => {
		expect(statusLabel(false)).toBe('Active');
		expect(statusLabel(true)).toBe('Deactivated');
	});
});

describe('statusVariant', () => {
	test('keeps the deactivated badge neutral, never destructive', () => {
		expect(statusVariant(false)).toBe('secondary');
		expect(statusVariant(true)).toBe('outline');
	});
});
