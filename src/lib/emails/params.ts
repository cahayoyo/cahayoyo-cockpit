import { z } from 'zod';
import { EMAIL_STATUS_FILTERS, type EmailFilters } from './filters';

export const emailSearchSchema = z.object({
	q: z.string().trim().catch(''),
	status: z.enum(EMAIL_STATUS_FILTERS).catch('active'),
	provider: z.string().trim().catch('')
});

// Unknown or malformed params degrade to the safe default: no search, no
// provider filter, Active only (grill decision 6).
export function parseEmailSearch(params: URLSearchParams): EmailFilters {
	const parsed = emailSearchSchema.parse({
		q: params.get('q') ?? '',
		status: params.get('status') ?? 'active',
		provider: params.get('provider') ?? ''
	});

	return {
		q: parsed.q,
		status: parsed.status,
		provider: parsed.provider || null
	};
}

// Inverse of parseEmailSearch: the canonical query string for a filter set.
// Default values are omitted, so a default state produces an empty string.
export function buildEmailSearch(filters: EmailFilters): string {
	const parts: string[] = [];
	if (filters.q) parts.push(`q=${encodeURIComponent(filters.q)}`);
	if (filters.status !== 'active') parts.push(`status=${filters.status}`);
	if (filters.provider) parts.push(`provider=${encodeURIComponent(filters.provider)}`);

	return parts.join('&');
}
