const PUBLIC_PATHS = new Set(['/login']);
const AUTH_API_PREFIX = '/api/auth/';
const BUILD_ASSETS_PREFIX = '/_app/';

// Paths that must stay reachable without a session: the login page, the Better
// Auth endpoints, and Vite/SvelteKit build assets (the login page needs them).
export function isPublicPath(pathname: string): boolean {
	return (
		PUBLIC_PATHS.has(pathname) ||
		pathname.startsWith(AUTH_API_PREFIX) ||
		pathname.startsWith(BUILD_ASSETS_PREFIX)
	);
}
