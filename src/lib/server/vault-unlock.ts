import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { envSchema } from './env';

export const VAULT_UNLOCK_COOKIE = 'vault_unlock';

// Sliding idle window: only vault actions (reveal / copy / create / edit)
// refresh the cookie, so general app activity never extends the unlock.
export const VAULT_UNLOCK_IDLE_MS = 15 * 60 * 1000;

type CookieReader = Pick<Cookies, 'get'>;
type CookieWriter = Pick<Cookies, 'set' | 'delete'>;

function unlockSecret(): string {
	return envSchema.parse(process.env).BETTER_AUTH_SECRET;
}

function signatureFor(timestamp: number, secret: string): string {
	return createHmac('sha256', secret).update(String(timestamp)).digest('base64url');
}

export function signUnlockToken(timestamp: number, secret: string): string {
	return `${timestamp}.${signatureFor(timestamp, secret)}`;
}

export function verifyUnlockToken(token: string, now: number, secret: string): boolean {
	const separator = token.indexOf('.');
	if (separator <= 0) {
		return false;
	}

	const timestamp = Number(token.slice(0, separator));
	if (!Number.isFinite(timestamp)) {
		return false;
	}

	const received = Buffer.from(token.slice(separator + 1));
	const expected = Buffer.from(signatureFor(timestamp, secret));
	if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
		return false;
	}

	const age = now - timestamp;
	return age >= 0 && age <= VAULT_UNLOCK_IDLE_MS;
}

/** True while a valid, unexpired unlock cookie is present. */
export function isVaultUnlocked(cookies: CookieReader, now = Date.now()): boolean {
	const token = cookies.get(VAULT_UNLOCK_COOKIE);
	return token !== undefined && verifyUnlockToken(token, now, unlockSecret());
}

/**
 * Issues (or refreshes) the unlock cookie. A session cookie with no max-age:
 * it dies with the browser, on idle expiry, and is cleared on logout.
 */
export function issueVaultUnlock(cookies: CookieWriter, now = Date.now()): void {
	cookies.set(VAULT_UNLOCK_COOKIE, signUnlockToken(now, unlockSecret()), {
		path: '/vault',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	});
}

export function clearVaultUnlock(cookies: Pick<Cookies, 'delete'>): void {
	cookies.delete(VAULT_UNLOCK_COOKIE, { path: '/vault' });
}
