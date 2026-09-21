import { describe, expect, test } from 'bun:test';
import {
	buildVaultSearch,
	filterVaultEntries,
	parseVaultSearch,
	type VaultFilters
} from './params';
import type { VaultType } from './types';

function parse(query: string): VaultFilters {
	return parseVaultSearch(new URLSearchParams(query));
}

describe('parseVaultSearch', () => {
	test('degrades unknown or malformed params to the defaults', () => {
		expect(parse('')).toEqual({ q: '', type: 'all', view: 'rows' });
		expect(parse('q=github&type=ssh_key&view=cards')).toEqual({
			q: 'github',
			type: 'all',
			view: 'rows'
		});
	});

	test('keeps known params and trims the query', () => {
		expect(parse('q=%20neon%20&type=api_key&view=table')).toEqual({
			q: 'neon',
			type: 'api_key',
			view: 'table'
		});
	});
});

describe('buildVaultSearch', () => {
	test('omits default values', () => {
		expect(buildVaultSearch({ q: '', type: 'all', view: 'rows' })).toBe('');
	});

	test('encodes the query and keeps the non-default filters', () => {
		expect(buildVaultSearch({ q: 'vps admin', type: 'login', view: 'table' })).toBe(
			'q=vps%20admin&type=login&view=table'
		);
	});
});

type Row = {
	title: string;
	type: VaultType;
	tags: string[];
	updatedAt: Date;
};

function row(title: string, type: VaultType, tags: string[], updatedAt: string): Row {
	return { title, type, tags, updatedAt: new Date(updatedAt) };
}

describe('filterVaultEntries', () => {
	const rows = [
		row('Neon console', 'login', ['database'], '2026-09-01T00:00:00Z'),
		row('R2 backup token', 'api_key', ['backup', 'cloudflare'], '2026-09-10T00:00:00Z'),
		row('Restore runbook', 'note', ['runbook'], '2026-09-05T00:00:00Z')
	];

	test('matches the title and tags, never the secret', () => {
		expect(
			filterVaultEntries(rows, { q: 'neon', type: 'all', view: 'rows' }).map((r) => r.title)
		).toEqual(['Neon console']);
		expect(
			filterVaultEntries(rows, { q: 'cloudflare', type: 'all', view: 'rows' }).map((r) => r.title)
		).toEqual(['R2 backup token']);
		expect(filterVaultEntries(rows, { q: 'secret-value', type: 'all', view: 'rows' })).toEqual([]);
	});

	test('filters by type and sorts most recently updated first', () => {
		expect(
			filterVaultEntries(rows, { q: '', type: 'login', view: 'rows' }).map((r) => r.title)
		).toEqual(['Neon console']);
		expect(
			filterVaultEntries(rows, { q: '', type: 'all', view: 'rows' }).map((r) => r.title)
		).toEqual(['R2 backup token', 'Restore runbook', 'Neon console']);
	});
});
