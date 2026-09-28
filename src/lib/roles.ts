// Better Auth role vocabulary (ADR-0005): `admin` is the super admin and every
// other account is a regular `user`. One source so the server guards and the
// navigation gating can never drift apart on a literal.
export const ADMIN_ROLE = 'admin';
export const USER_ROLE = 'user';
