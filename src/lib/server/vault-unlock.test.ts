import { describe, expect, test } from 'bun:test';
import { VAULT_UNLOCK_IDLE_MS, signUnlockToken, verifyUnlockToken } from './vault-unlock';

const SECRET = 'test-secret';
const USER = 'user-1';
const NOW = Date.parse('2026-09-21T12:00:00Z');

describe('vault unlock token', () => {
	test('accepts a freshly issued token', () => {
		expect(verifyUnlockToken(signUnlockToken(USER, NOW, SECRET), USER, NOW, SECRET)).toBe(true);
	});

	test('expires after the 15-minute idle window', () => {
		const token = signUnlockToken(USER, NOW, SECRET);

		expect(VAULT_UNLOCK_IDLE_MS).toBe(15 * 60 * 1000);
		expect(verifyUnlockToken(token, USER, NOW + VAULT_UNLOCK_IDLE_MS, SECRET)).toBe(true);
		expect(verifyUnlockToken(token, USER, NOW + VAULT_UNLOCK_IDLE_MS + 1, SECRET)).toBe(false);
	});

	test('rejects a token signed with another secret', () => {
		expect(verifyUnlockToken(signUnlockToken(USER, NOW, 'another-secret'), USER, NOW, SECRET)).toBe(
			false
		);
	});

	test('rejects a token issued to another account', () => {
		expect(verifyUnlockToken(signUnlockToken('user-2', NOW, SECRET), USER, NOW, SECRET)).toBe(
			false
		);
	});

	test('rejects a tampered timestamp, a future timestamp, and malformed tokens', () => {
		const signature = signUnlockToken(USER, NOW, SECRET).split('.')[1];

		expect(verifyUnlockToken(`${NOW + 1000}.${signature}`, USER, NOW + 1000, SECRET)).toBe(false);
		expect(verifyUnlockToken(signUnlockToken(USER, NOW + 1000, SECRET), USER, NOW, SECRET)).toBe(
			false
		);
		expect(verifyUnlockToken('', USER, NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken('nonsense', USER, NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken(`abc.${signature}`, USER, NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken(`${NOW}.`, USER, NOW, SECRET)).toBe(false);
	});
});
