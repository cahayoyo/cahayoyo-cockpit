import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { envSchema } from './env';

export const VAULT_UNLOCK_COOKIE = 'vault_unlock';

// Sliding idle window: only vault actions (reveal / copy / create / edit)
// refresh the cookie, so general app activity never extends the unlock.
export const VAULT_UNLOCK_IDLE_MS = 15 * 60 * 1000;

type CookieReader = Pick<Cookies, 'get'>;
type CookieWriter = Pick<Cookies, 'set' | 'delete'>;

// Read once at boot; a missing secret fails fast (env.ts).
const unlockSecret = envSchema.parse(process.env).BETTER_AUTH_SECRET;

// The token carries the account id in its signature: an unlock issued to one
// account never unlocks another account's vault in the same browser.
function signatureFor(userId: string, timestamp: number, secret: string): string {
	return createHmac('sha256', secret).update(`${userId}:${timestamp}`).digest('base64url');
}

export function signUnlockToken(userId: string, timestamp: number, secret: string): string {
	return `${timestamp}.${signatureFor(userId, timestamp, secret)}`;
}

export function verifyUnlockToken(
	token: string,
	userId: string,
	now: number,
	secret: string
): boolean {
	const separator = token.indexOf('.');
	if (separator <= 0) {
		return false;
	}

	const timestamp = Number(token.slice(0, separator));
	if (!Number.isFinite(timestamp)) {
		return false;
	}

	const received = Buffer.from(token.slice(separator + 1));
	const expected = Buffer.from(signatureFor(userId, timestamp, secret));
	if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
		return false;
	}

	const age = now - timestamp;
	return age >= 0 && age <= VAULT_UNLOCK_IDLE_MS;
}

/** True while a valid, unexpired unlock cookie was issued to this account. */
export function isVaultUnlocked(cookies: CookieReader, userId: string, now = Date.now()): boolean {
	const token = cookies.get(VAULT_UNLOCK_COOKIE);
	return token !== undefined && verifyUnlockToken(token, userId, now, unlockSecret);
}

/**
 * Issues (or refreshes) the unlock cookie. A session cookie with no max-age:
 * it dies with the browser, on idle expiry, and is cleared on logout.
 */
export function issueVaultUnlock(cookies: CookieWriter, userId: string, now = Date.now()): void {
	cookies.set(VAULT_UNLOCK_COOKIE, signUnlockToken(userId, now, unlockSecret), {
		path: '/vault',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	});
}

export function clearVaultUnlock(cookies: Pick<Cookies, 'delete'>): void {
	cookies.delete(VAULT_UNLOCK_COOKIE, { path: '/vault' });
}
