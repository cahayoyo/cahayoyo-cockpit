import { z } from 'zod';
import { VAULT_TYPES, VAULT_VIEWS, type VaultType, type VaultView } from './types';

// Type filter values as they appear in the URL: `all` shows every type.
export const VAULT_TYPE_FILTERS = ['all', ...VAULT_TYPES] as const;

export type VaultTypeFilter = (typeof VAULT_TYPE_FILTERS)[number];

export type VaultFilters = {
	q: string;
	type: VaultTypeFilter;
	view: VaultView;
};

export const vaultSearchSchema = z.object({
	q: z.string().trim().catch(''),
	type: z.enum(VAULT_TYPE_FILTERS).catch('all'),
	view: z.enum(VAULT_VIEWS).catch('rows')
});

// Unknown or malformed params degrade to the safe default: no search, no type
// filter, rows view (same pattern as the emails page).
export function parseVaultSearch(params: URLSearchParams): VaultFilters {
	const parsed = vaultSearchSchema.parse({
		q: params.get('q') ?? '',
		type: params.get('type') ?? 'all',
		view: params.get('view') ?? 'rows'
	});

	return { q: parsed.q, type: parsed.type, view: parsed.view };
}

// Inverse of parseVaultSearch: the canonical query string for a filter set.
// Default values are omitted, so a default state produces an empty string.
export function buildVaultSearch(filters: VaultFilters): string {
	const parts: string[] = [];
	if (filters.q) parts.push(`q=${encodeURIComponent(filters.q)}`);
	if (filters.type !== 'all') parts.push(`type=${filters.type}`);
	if (filters.view !== 'rows') parts.push(`view=${filters.view}`);

	return parts.join('&');
}

export type FilterableVaultEntry = {
	title: string;
	type: VaultType;
	tags: string[];
	updatedAt: Date;
};

// Search matches the title and tags only — secret values are never searchable
// (grill decision 6). The sort is fixed: most recently updated first.
export function filterVaultEntries<T extends FilterableVaultEntry>(
	entries: readonly T[],
	filters: VaultFilters
): T[] {
	const q = filters.q.trim().toLowerCase();

	return entries
		.filter(
			(entry) =>
				(!q ||
					entry.title.toLowerCase().includes(q) ||
					entry.tags.some((tag) => tag.toLowerCase().includes(q))) &&
				(filters.type === 'all' || entry.type === filters.type)
		)
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
