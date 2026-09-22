import { describe, expect, test } from 'bun:test';
import { isPublicPath } from './auth-paths';

describe('isPublicPath', () => {
	test('allows the login page', () => {
		expect(isPublicPath('/login')).toBe(true);
	});

	test('allows the Better Auth API and build assets', () => {
		expect(isPublicPath('/api/auth/sign-in/email')).toBe(true);
		expect(isPublicPath('/_app/immutable/chunks/app.js')).toBe(true);
	});

	test('does not match lookalike prefixes', () => {
		expect(isPublicPath('/api/authx')).toBe(false);
		expect(isPublicPath('/_application')).toBe(false);
	});

	test('protects app routes', () => {
		expect(isPublicPath('/')).toBe(false);
		expect(isPublicPath('/bookmarks')).toBe(false);
		expect(isPublicPath('/login/reset')).toBe(false);
	});
});
