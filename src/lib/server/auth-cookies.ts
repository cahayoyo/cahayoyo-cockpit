// Applies Better Auth's Set-Cookie headers to a SvelteKit response. Mirrors the
// behaviour of better-auth's `sveltekitCookies` plugin, which cannot be used
// here: it is configured with `getRequestEvent` from `$app/server`, and
// scripts/seed-dev.ts loads this auth instance under plain Bun, where that
// module does not resolve.
import type { Cookies } from '@sveltejs/kit';
import { parseSetCookieHeader, toCookieOptions } from 'better-auth/cookies/utils';

export function applyAuthCookies(cookies: Pick<Cookies, 'set'>, response: Response): void {
	const header = response.headers.get('set-cookie');
	if (!header) return;

	for (const [name, attributes] of parseSetCookieHeader(header)) {
		cookies.set(name, attributes.value, {
			...toCookieOptions(attributes),
			path: attributes.path || '/'
		});
	}
}
