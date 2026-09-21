import { describe, expect, test } from 'bun:test';
import { AMBIGUOUS_CHARS, generatePassword } from './password';

describe('generatePassword', () => {
	test('respects the requested length', () => {
		expect(generatePassword(20, false)).toHaveLength(20);
		expect(generatePassword(8, true)).toHaveLength(8);
	});

	test('clamps the length to 1–256', () => {
		expect(generatePassword(0, false)).toHaveLength(1);
		expect(generatePassword(1000, false)).toHaveLength(256);
	});

	test('uses the full charset by default', () => {
		const password = generatePassword(64, false);
		expect(/[a-z]/.test(password)).toBe(true);
		expect(/[A-Z]/.test(password)).toBe(true);
		expect(/[0-9]/.test(password)).toBe(true);
		expect(/[^a-zA-Z0-9]/.test(password)).toBe(true);
	});

	test('excludes the ambiguous characters when asked', () => {
		const password = generatePassword(64, true);
		expect(password).toHaveLength(64);
		for (const char of AMBIGUOUS_CHARS) {
			expect(password.includes(char)).toBe(false);
		}
	});
});
