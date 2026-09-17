import { describe, expect, test } from 'bun:test';
import { likePattern, noteSnippet, sortNotes } from './list';

type Row = { id: string; pinned: boolean; updatedAt: Date };

function row(id: string, pinned: boolean, updatedAt: string): Row {
	return { id, pinned, updatedAt: new Date(updatedAt) };
}

describe('sortNotes', () => {
	test('puts pinned notes first, then orders by most recently updated', () => {
		const sorted = sortNotes([
			row('a', false, '2026-09-15T10:00:00Z'),
			row('b', true, '2026-09-10T10:00:00Z'),
			row('c', false, '2026-09-16T10:00:00Z'),
			row('d', true, '2026-09-14T10:00:00Z')
		]);

		expect(sorted.map((note) => note.id)).toEqual(['d', 'b', 'c', 'a']);
	});

	test('does not mutate the input', () => {
		const rows = [row('a', false, '2026-09-15T10:00:00Z'), row('b', false, '2026-09-16T10:00:00Z')];
		sortNotes(rows);
		expect(rows.map((note) => note.id)).toEqual(['a', 'b']);
	});
});

describe('noteSnippet', () => {
	test('returns plain text for a simple body', () => {
		expect(noteSnippet('Regression run log for the frozen build.')).toBe(
			'Regression run log for the frozen build.'
		);
	});

	test('strips markdown syntax and collapses the body to one line', () => {
		expect(noteSnippet('# Heading\n\nSome **bold** and `code` with [a link](https://x.dev)')).toBe(
			'Heading Some bold and code with a link'
		);
	});

	test('strips emphasis markers but keeps lone asterisks and code content', () => {
		expect(noteSnippet('**bold** and *italic* and ~~struck~~')).toBe('bold and italic and struck');
		expect(noteSnippet('multiply 2 * 3')).toBe('multiply 2 * 3');
		expect(noteSnippet('code `a*b` stays')).toBe('code a*b stays');
	});

	test('strips list markers and blockquote markers', () => {
		expect(noteSnippet('> quoted\n\n1. first\n- second')).toBe('quoted first second');
	});

	test('removes image references but keeps code content', () => {
		expect(noteSnippet('![pasted image](/media/3f2504e0-4f89-41d3-9a0c-0305e82c3301)')).toBe('');
		expect(noteSnippet('Run it:\n\n```bash\ncurl -s https://api.mail.tm/domains\n```')).toBe(
			'Run it: curl -s https://api.mail.tm/domains'
		);
	});

	test('keeps snake_case identifiers and hyphenated words intact', () => {
		expect(noteSnippet('Set folder_id, then updated_at; state-of-the-art.')).toBe(
			'Set folder_id, then updated_at; state-of-the-art.'
		);
	});

	test('truncates at 80 characters with an ellipsis', () => {
		const snippet = noteSnippet('a'.repeat(100));
		expect(snippet).toBe(`${'a'.repeat(80)}…`);
	});

	test('stays short for short bodies and empty bodies', () => {
		expect(noteSnippet('short')).toBe('short');
		expect(noteSnippet('')).toBe('');
		expect(noteSnippet('   \n\n  ')).toBe('');
	});
});

describe('likePattern', () => {
	test('wraps a plain term in wildcards', () => {
		expect(likePattern('release')).toBe('%release%');
	});

	test('escapes LIKE metacharacters so they match literally', () => {
		expect(likePattern('100%')).toBe('%100\\%%');
		expect(likePattern('a_b')).toBe('%a\\_b%');
		expect(likePattern('c:\\temp')).toBe('%c:\\\\temp%');
	});
});
