import type { VaultType } from './types';

// Type-conditional editor labels (grill decision 9). An empty label hides the
// field for that type; `note` renders the secret as the "Encrypted note"
// textarea instead of an input.
export const VAULT_TYPE_META: Record<
	VaultType,
	{
		label: string;
		usernameLabel: string;
		secretLabel: string;
		urlLabel: string;
	}
> = {
	login: {
		label: 'Login',
		usernameLabel: 'Username',
		secretLabel: 'Password',
		urlLabel: 'URL'
	},
	api_key: {
		label: 'API key',
		usernameLabel: 'Key ID (optional)',
		secretLabel: 'API key',
		urlLabel: 'Service URL'
	},
	note: {
		label: 'Note',
		usernameLabel: '',
		secretLabel: 'Encrypted note',
		urlLabel: ''
	}
};
