import { describe, expect, test } from 'bun:test';
import type { Cookies } from '@sveltejs/kit';
import { applyAuthCookies } from './auth-cookies';

function createCookieJar() {
	const calls: Array<Parameters<Cookies['set']>> = [];
	const jar: Pick<Cookies, 'set'> = {
		set: (...args: Parameters<Cookies['set']>) => {
			calls.push(args);
		}
	};
	return { calls, jar };
}

describe('applyAuthCookies', () => {
	test('copies a session cookie with its attributes', () => {
		const { calls, jar } = createCookieJar();
		const response = new Response(null, {
			headers: {
				'set-cookie':
					'better-auth.session_token=token-1; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800'
			}
		});

		applyAuthCookies(jar, response);

		expect(calls).toHaveLength(1);
		expect(calls[0][0]).toBe('better-auth.session_token');
		expect(calls[0][1]).toBe('token-1');
		expect(calls[0][2]).toMatchObject({
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 604800
		});
	});

	test('preserves cookie deletion headers (empty value, expires in the past)', () => {
		const { calls, jar } = createCookieJar();
		const response = new Response(null, {
			headers: {
				'set-cookie': 'better-auth.session_token=; Path=/; HttpOnly; Max-Age=0'
			}
		});

		applyAuthCookies(jar, response);

		expect(calls).toHaveLength(1);
		expect(calls[0][1]).toBe('');
		expect(calls[0][2]).toMatchObject({ path: '/', httpOnly: true, maxAge: 0 });
	});

	test('does nothing without a Set-Cookie header', () => {
		const { calls, jar } = createCookieJar();

		applyAuthCookies(jar, new Response(null));

		expect(calls).toHaveLength(0);
	});
});
