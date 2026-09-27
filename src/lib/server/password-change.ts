export type PasswordChangeFailure = {
	field?: 'currentPassword' | 'newPassword';
	message: string;
};

/**
 * Maps a failed `/change-password` response to the form failure the user sees
 * (spec §7). Only Better Auth's wrong-current-password code becomes a field
 * error; everything else stays generic (CODE_STANDARDS §5).
 */
export function passwordChangeFailure(code: string | undefined): PasswordChangeFailure {
	if (code === 'INVALID_PASSWORD') {
		return { field: 'currentPassword', message: 'Your current password is incorrect.' };
	}

	return { message: 'Could not change the password. Try again.' };
}
