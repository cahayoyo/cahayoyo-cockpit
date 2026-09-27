import { describe, expect, test } from 'bun:test';
import { passwordChangeFailure } from './password-change';

describe('passwordChangeFailure', () => {
	test('maps the wrong current password to its field', () => {
		expect(passwordChangeFailure('INVALID_PASSWORD')).toEqual({
			field: 'currentPassword',
			message: 'Your current password is incorrect.'
		});
	});

	test('keeps every other failure generic and field-less', () => {
		expect(passwordChangeFailure('CREDENTIAL_ACCOUNT_NOT_FOUND')).toEqual({
			message: 'Could not change the password. Try again.'
		});
		expect(passwordChangeFailure(undefined)).toEqual({
			message: 'Could not change the password. Try again.'
		});
	});
});
