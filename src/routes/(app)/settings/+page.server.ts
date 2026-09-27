import { authActions } from '$lib/server/auth-actions';

// The settings page spreads the self-service auth actions (#88); today that is
// only `changePassword`.
export const actions = authActions;
