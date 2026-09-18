import { describe, expect, test } from 'bun:test';
import { countText } from './counter';
import { formatJson, minifyJson, parseJson } from './json-tool';
import { pick, randomInt } from './random';
import {
	charsetAlphabet,
	DEFAULT_CHARSET,
	generatePattern,
	generateString
} from './string-generator';
import {
	generateAddress,
	generateEmail,
	generateName,
	generateNik,
	generatePhone,
	generateRecord,
	generateTestData
} from './test-data';

describe('countText', () => {
	test('counts characters, words and lines', () => {
		const stats = countText('hello world\nsecond line');
		expect(stats.characters).toBe(23);
		expect(stats.charactersNoSpaces).toBe(20);
		expect(stats.words).toBe(4);
		expect(stats.lines).toBe(2);
	});

	test('counts non-overlapping substring occurrences', () => {
		expect(countText('banana', 'ana').occurrences).toBe(1);
		expect(countText('aaaa', 'aa').occurrences).toBe(2);
	});

	test('handles empty input', () => {
		const stats = countText('');
		expect(stats.characters).toBe(0);
		expect(stats.words).toBe(0);
		expect(stats.lines).toBe(0);
		expect(stats.occurrences).toBe(0);
	});
});

describe('random', () => {
	test('returns 0 for invalid bounds', () => {
		expect(randomInt(0)).toBe(0);
		expect(randomInt(-5)).toBe(0);
		expect(randomInt(Number.NaN)).toBe(0);
		expect(randomInt(Number.POSITIVE_INFINITY)).toBe(0);
	});

	test('stays within the requested range', () => {
		for (let index = 0; index < 50; index += 1) {
			const value = randomInt(3);
			expect(Number.isInteger(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(3);
		}
	});

	test('pick returns an element of the list', () => {
		expect(['a', 'b', 'c']).toContain(pick(['a', 'b', 'c']));
	});
});

describe('json-tool', () => {
	test('formats with 2-space indent', () => {
		expect(formatJson('{"b":1,"a":[true,null]}')).toEqual({
			ok: true,
			output: '{\n  "b": 1,\n  "a": [\n    true,\n    null\n  ]\n}'
		});
	});

	test('minifies', () => {
		expect(minifyJson('{ "b": 1, "a": [true, null] }')).toEqual({
			ok: true,
			output: '{"b":1,"a":[true,null]}'
		});
	});

	test('reports parse errors', () => {
		const result = parseJson('{"a": }');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.message.length).toBeGreaterThan(0);
	});

	test('reports the error line and column', () => {
		const result = parseJson('{\n  "a": 1,\n  "b": }\n');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.line).toBe(3);
		expect(result.column).toBe(8);
	});

	test('locates a trailing comma error', () => {
		const result = parseJson('[1, 2, ]');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.line).toBe(1);
		expect(result.column).toBe(8);
	});

	test('locates errors relative to the raw input', () => {
		const indented = parseJson('  {"a": }');
		expect(indented.ok).toBe(false);
		if (indented.ok) return;
		expect([indented.line, indented.column]).toEqual([1, 9]);

		const padded = parseJson('\n\n{"a": }');
		expect(padded.ok).toBe(false);
		if (padded.ok) return;
		expect([padded.line, padded.column]).toEqual([3, 7]);
	});

	test('formatJson carries the located error through', () => {
		const result = formatJson('{"a": }');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.line).toBe(1);
		expect(result.column).toBe(7);
	});

	test('rejects empty input', () => {
		expect(parseJson('').ok).toBe(false);
	});
});

describe('string generator', () => {
	test('uses only the selected charsets', () => {
		expect(
			generateString(64, { lowercase: false, uppercase: false, digits: true, symbols: false })
		).toMatch(/^[0-9]{64}$/);
		expect(
			generateString(32, { lowercase: true, uppercase: false, digits: false, symbols: false })
		).toMatch(/^[a-z]{32}$/);
	});

	test('returns an empty string when no charset is selected', () => {
		expect(
			generateString(10, { lowercase: false, uppercase: false, digits: false, symbols: false })
		).toBe('');
	});

	test('clamps the length to 1..256', () => {
		expect(generateString(0, DEFAULT_CHARSET)).toHaveLength(1);
		expect(generateString(10_000, DEFAULT_CHARSET)).toHaveLength(256);
	});

	test('default alphabet includes letters and digits', () => {
		const alphabet = charsetAlphabet(DEFAULT_CHARSET);
		expect(alphabet).toContain('a');
		expect(alphabet).toContain('Z');
		expect(alphabet).toContain('0');
	});
});

describe('string generator pattern mode', () => {
	test('replaces every token with a matching character', () => {
		expect(generatePattern('AAAA')).toMatch(/^[A-Z]{4}$/);
		expect(generatePattern('aaaa')).toMatch(/^[a-z]{4}$/);
		expect(generatePattern('####')).toMatch(/^[0-9]{4}$/);
		expect(generatePattern('????')).toMatch(/^[A-Za-z0-9]{4}$/);
	});

	test('passes literals through unchanged', () => {
		expect(generatePattern('INV-####')).toMatch(/^INV-[0-9]{4}$/);
		expect(generatePattern('user_a#?')).toMatch(/^user_[a-z][0-9][A-Za-z0-9]$/);
		expect(generatePattern('no tokens!')).toBe('no tokens!');
	});

	test('mixes tokens and literals', () => {
		expect(generatePattern('A?#a')).toMatch(/^[A-Z][A-Za-z0-9][0-9][a-z]$/);
	});

	test('returns an empty string for an empty pattern', () => {
		expect(generatePattern('')).toBe('');
	});
});

describe('test data', () => {
	test('names are two words', () => {
		expect(generateName().split(' ')).toHaveLength(2);
	});

	test('email derives from the name and is well-formed', () => {
		expect(generateEmail('Budi Santoso')).toMatch(/^budi\.santoso\d{1,2}@[a-z.]+$/);
	});

	test('phone starts with +62', () => {
		for (let index = 0; index < 20; index += 1) {
			expect(generatePhone()).toMatch(/^\+62\d{11}$/);
		}
	});

	test('NIK is 16 digits', () => {
		expect(generateNik()).toMatch(/^\d{16}$/);
	});

	test('address is Indonesian-shaped and non-empty', () => {
		expect(generateAddress()).toMatch(/^Jl\. .+ No\. \d+, RT \d{2}\/RW \d{2}, .+ \d{5}$/);
	});

	test('a record has every field', () => {
		expect(Object.keys(generateRecord()).sort()).toEqual([
			'address',
			'email',
			'name',
			'nik',
			'phone'
		]);
	});

	test('count clamps to 1..10', () => {
		expect(generateTestData('name', 0)).toHaveLength(1);
		expect(generateTestData('name', 50)).toHaveLength(10);
	});
});
