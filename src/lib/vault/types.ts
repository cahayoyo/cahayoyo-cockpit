// View model the vault page and its components share. The server layer returns
// rows that structurally satisfy this shape plus their tag names.
export const VAULT_TYPES = ['login', 'api_key', 'note'] as const;

export type VaultType = (typeof VAULT_TYPES)[number];

// List presentation the toolbar toggles between; `rows` is the default, so the
// `?view=` param is omitted for it.
export const VAULT_VIEWS = ['rows', 'table'] as const;

export type VaultView = (typeof VAULT_VIEWS)[number];

export type VaultEntryItem = {
	id: string;
	title: string;
	type: VaultType;
	username: string | null;
	url: string | null;
	tags: string[];
	updatedAt: Date;
};

// Filter patch: omitted keys keep their current value (same convention as the
// emails and bookmarks toolbars).
export type VaultFilterPatch = {
	q?: string;
	type?: string;
	view?: string;
};
