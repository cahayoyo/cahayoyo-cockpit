import { describe, expect, test } from 'bun:test';
import { filterEmails, type EmailFilters, type FilterableEmail } from './filters';

type Row = FilterableEmail & { id: string };

const rows: Row[] = [
	{
		id: 'e1',
		address: 'qa.checkout.8841@mail.tm',
		provider: 'mail.tm',
		purpose: 'Checkout retry verification',
		notes: 'Staging retry run only.',
		status: 'active',
		createdAt: new Date('2026-09-15T09:00:00Z')
	},
	{
		id: 'e2',
		address: 'signup.limit.qa@yopmail.com',
		provider: 'yopmail',
		purpose: 'Rate-limit signup test',
		notes: null,
		status: 'active',
		createdAt: new Date('2026-09-17T09:00:00Z')
	},
	{
		id: 'e3',
		address: 'reset.flow.b7@guerrillamail.com',
		provider: 'guerrillamail',
		purpose: 'Password reset email check',
		notes: 'Magic link lands in spam.',
		status: 'dead',
		createdAt: new Date('2026-09-16T09:00:00Z')
	},
	{
		id: 'e4',
		address: 'no.provider@mail.tm',
		provider: null,
		purpose: null,
		notes: null,
		status: 'dead',
		createdAt: new Date('2026-09-14T09:00:00Z')
	}
];

const defaults: EmailFilters = {
	q: '',
	status: 'active',
	provider: null
};

function ids(items: { id: string }[]): string[] {
	return items.map((item) => item.id);
}

describe('filterEmails', () => {
	test('defaults to active status, newest first', () => {
		expect(ids(filterEmails(rows, defaults))).toEqual(['e2', 'e1']);
	});

	test('status all returns every record, newest first', () => {
		expect(ids(filterEmails(rows, { ...defaults, status: 'all' }))).toEqual([
			'e2',
			'e3',
			'e1',
			'e4'
		]);
	});

	test('filters dead records', () => {
		expect(ids(filterEmails(rows, { ...defaults, status: 'dead' }))).toEqual(['e3', 'e4']);
	});

	test('search matches address, purpose and notes case-insensitively', () => {
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', q: 'YOPMAIL' }))).toEqual(['e2']);
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', q: 'rate-limit' }))).toEqual([
			'e2'
		]);
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', q: 'SPAM' }))).toEqual(['e3']);
	});

	test('filters by provider', () => {
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', provider: 'mail.tm' }))).toEqual([
			'e1'
		]);
	});

	test('combines status, provider and search', () => {
		expect(
			ids(filterEmails(rows, { ...defaults, status: 'dead', provider: 'guerrillamail', q: 'spam' }))
		).toEqual(['e3']);
	});

	test('provider filter never matches records with no provider', () => {
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', provider: 'mail.tm' }))).toEqual([
			'e1'
		]);
		expect(ids(filterEmails(rows, { ...defaults, status: 'all', provider: 'nope' }))).toEqual([]);
	});

	test('does not mutate the input array', () => {
		const input = [...rows];
		filterEmails(input, { ...defaults, status: 'all' });
		expect(ids(input)).toEqual(['e1', 'e2', 'e3', 'e4']);
	});
});
