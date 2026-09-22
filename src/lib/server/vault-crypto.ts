import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM with a versioned payload (`v1:<base64 iv>:<base64 authTag>:<base64
// ciphertext>`), so a future key rotation can add a `v2:` scheme while existing
// entries stay decryptable. Key material and plaintext never reach logs or
// error messages; decrypt failures are data errors returned to the caller.
const CIPHER = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const VERSION = 'v1';
const DECRYPT_ERROR = 'Cannot decrypt this entry.';

export type DecryptResult = { ok: true; value: string } | { ok: false; error: string };

export function encryptSecret(plaintext: string, key: Uint8Array): string {
	if (key.length !== KEY_BYTES) {
		throw new Error(`Vault encryption key must be ${KEY_BYTES} bytes.`);
	}

	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(CIPHER, key, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return [
		VERSION,
		iv.toString('base64'),
		authTag.toString('base64'),
		ciphertext.toString('base64')
	].join(':');
}

export function decryptSecret(payload: string, key: Uint8Array): DecryptResult {
	if (key.length !== KEY_BYTES) {
		return { ok: false, error: DECRYPT_ERROR };
	}

	const parts = payload.split(':');
	if (parts.length !== 4 || parts[0] !== VERSION) {
		return { ok: false, error: DECRYPT_ERROR };
	}

	const iv = Buffer.from(parts[1], 'base64');
	const authTag = Buffer.from(parts[2], 'base64');
	const ciphertext = Buffer.from(parts[3], 'base64');

	if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
		return { ok: false, error: DECRYPT_ERROR };
	}

	try {
		const decipher = createDecipheriv(CIPHER, key, iv);
		decipher.setAuthTag(authTag);
		const value = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
		return { ok: true, value };
	} catch {
		// Tampered payload, wrong key, or unsupported algorithm — deliberately
		// swallowed: the caller (and the UI) only needs the distinct failure.
		return { ok: false, error: DECRYPT_ERROR };
	}
}
