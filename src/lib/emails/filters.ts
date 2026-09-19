import type { EmailStatus } from './types';

// Status filter values as they appear in the URL: `all` shows both sections.
export const EMAIL_STATUS_FILTERS = ['active', 'dead', 'all'] as const;

export type EmailStatusFilter = (typeof EMAIL_STATUS_FILTERS)[number];

export type FilterableEmail = {
	address: string;
	provider: string | null;
	purpose: string | null;
	notes: string | null;
	status: EmailStatus;
	createdAt: Date;
};

export type EmailFilters = {
	q: string;
	status: EmailStatusFilter;
	provider: string | null;
};

export function filterEmails<T extends FilterableEmail>(
	emails: readonly T[],
	filters: EmailFilters
): T[] {
	const q = filters.q.trim().toLowerCase();

	return emails
		.filter(
			(email) =>
				(!q ||
					email.address.toLowerCase().includes(q) ||
					(email.purpose?.toLowerCase().includes(q) ?? false) ||
					(email.notes?.toLowerCase().includes(q) ?? false)) &&
				(filters.status === 'all' || email.status === filters.status) &&
				(filters.provider === null || email.provider === filters.provider)
		)
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
