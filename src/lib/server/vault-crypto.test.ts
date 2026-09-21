import { randomBytes } from 'node:crypto';
import { describe, expect, test } from 'bun:test';
import { decryptSecret, encryptSecret } from './vault-crypto';

const KEY = randomBytes(32);
const OTHER_KEY = randomBytes(32);

// Flip the first base64 character so the decoded value changes while the
// payload stays well-formed.
function tamper(base64: string): string {
	return (base64[0] === 'A' ? 'B' : 'A') + base64.slice(1);
}

describe('encryptSecret / decryptSecret', () => {
	test('round-trips plaintext, including unicode', () => {
		const payload = encryptSecret('p@ssw0rd — rahasia', KEY);

		expect(payload.startsWith('v1:')).toBe(true);
		expect(payload.split(':')).toHaveLength(4);
		expect(decryptSecret(payload, KEY)).toEqual({ ok: true, value: 'p@ssw0rd — rahasia' });
	});

	test('produces a different payload on every call (random IV)', () => {
		expect(encryptSecret('same input', KEY)).not.toBe(encryptSecret('same input', KEY));
	});

	test('rejects a tampered ciphertext or auth tag', () => {
		const [version, iv, tag, data] = encryptSecret('tamper me', KEY).split(':');

		expect(decryptSecret([version, iv, tag, tamper(data)].join(':'), KEY).ok).toBe(false);
		expect(decryptSecret([version, iv, tamper(tag), data].join(':'), KEY).ok).toBe(false);
		expect(decryptSecret([version, tamper(iv), tag, data].join(':'), KEY).ok).toBe(false);
	});

	test('rejects a wrong key', () => {
		const payload = encryptSecret('wrong key test', KEY);

		expect(decryptSecret(payload, OTHER_KEY).ok).toBe(false);
	});

	test('rejects malformed payloads', () => {
		const malformed = [
			'',
			'plaintext',
			'v1:onlythree',
			'v1:a:b',
			'v2:AAAA:BBBB:CCCC',
			'v1:!!!!:!!!!:!!!!'
		];

		for (const payload of malformed) {
			expect(decryptSecret(payload, KEY).ok).toBe(false);
		}
	});

	test('rejects a wrong key length', () => {
		expect(() => encryptSecret('bad key', randomBytes(16))).toThrow();
		expect(decryptSecret(encryptSecret('bad key check', KEY), randomBytes(16)).ok).toBe(false);
	});
});
