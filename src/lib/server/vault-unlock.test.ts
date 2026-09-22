import { describe, expect, test } from 'bun:test';
import { VAULT_UNLOCK_IDLE_MS, signUnlockToken, verifyUnlockToken } from './vault-unlock';

const SECRET = 'test-secret';
const NOW = Date.parse('2026-09-21T12:00:00Z');

describe('vault unlock token', () => {
	test('accepts a freshly issued token', () => {
		expect(verifyUnlockToken(signUnlockToken(NOW, SECRET), NOW, SECRET)).toBe(true);
	});

	test('expires after the 15-minute idle window', () => {
		const token = signUnlockToken(NOW, SECRET);

		expect(VAULT_UNLOCK_IDLE_MS).toBe(15 * 60 * 1000);
		expect(verifyUnlockToken(token, NOW + VAULT_UNLOCK_IDLE_MS, SECRET)).toBe(true);
		expect(verifyUnlockToken(token, NOW + VAULT_UNLOCK_IDLE_MS + 1, SECRET)).toBe(false);
	});

	test('rejects a token signed with another secret', () => {
		expect(verifyUnlockToken(signUnlockToken(NOW, 'another-secret'), NOW, SECRET)).toBe(false);
	});

	test('rejects a tampered timestamp, a future timestamp, and malformed tokens', () => {
		const signature = signUnlockToken(NOW, SECRET).split('.')[1];

		expect(verifyUnlockToken(`${NOW + 1000}.${signature}`, NOW + 1000, SECRET)).toBe(false);
		expect(verifyUnlockToken(signUnlockToken(NOW + 1000, SECRET), NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken('', NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken('nonsense', NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken(`abc.${signature}`, NOW, SECRET)).toBe(false);
		expect(verifyUnlockToken(`${NOW}.`, NOW, SECRET)).toBe(false);
	});
});
