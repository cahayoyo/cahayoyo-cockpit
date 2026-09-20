import { describe, expect, test } from 'bun:test';
import type { EmailFilters } from './filters';
import { buildEmailSearch, parseEmailSearch } from './params';

const defaults: EmailFilters = {
	q: '',
	status: 'active',
	provider: null
};

function parse(query: string): EmailFilters {
	return parseEmailSearch(new URLSearchParams(query));
}

describe('parseEmailSearch', () => {
	test('returns safe defaults for missing params', () => {
		expect(parse('')).toEqual(defaults);
	});

	test('trims the query', () => {
		expect(parse('q=%20mail.tm%20').q).toBe('mail.tm');
	});

	test('accepts every status filter value', () => {
		expect(parse('status=dead').status).toBe('dead');
		expect(parse('status=all').status).toBe('all');
	});

	test('falls back to Active for unknown or empty status values', () => {
		expect(parse('status=archived').status).toBe('active');
		expect(parse('status=').status).toBe('active');
	});

	test('keeps a provider, drops empty ones', () => {
		expect(parse('provider=mail.tm').provider).toBe('mail.tm');
		expect(parse('provider=%20').provider).toBeNull();
	});
});

describe('buildEmailSearch', () => {
	test('omits every default so the URL stays clean', () => {
		expect(buildEmailSearch(defaults)).toBe('');
	});

	test('round-trips a fully-populated filter set', () => {
		const filters: EmailFilters = {
			q: 'checkout probe',
			status: 'dead',
			provider: 'mail.tm'
		};

		expect(parse(buildEmailSearch(filters))).toEqual(filters);
	});

	test('escapes values that need encoding', () => {
		const query = buildEmailSearch({ ...defaults, q: 'a&b=c' });
		expect(parse(query).q).toBe('a&b=c');
	});
});
