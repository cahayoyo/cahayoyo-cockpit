import { describe, expect, test } from 'bun:test';
import { fallbackLetter, formatBytes, hostname } from './format';

describe('fallbackLetter', () => {
	test('uses the first letter, uppercased', () => {
		expect(fallbackLetter('  sveltekit routing')).toBe('S');
	});

	test('falls back to a question mark for blank titles', () => {
		expect(fallbackLetter('   ')).toBe('?');
	});
});

describe('hostname', () => {
	test('drops the scheme, path, and www prefix', () => {
		expect(hostname('https://www.svelte.dev/docs/kit/routing')).toBe('svelte.dev');
	});

	test('returns the input when it is not a parseable url', () => {
		expect(hostname('not a url')).toBe('not a url');
	});
});

describe('formatBytes', () => {
	test('renders kilobytes rounded to whole numbers', () => {
		expect(formatBytes(412_000)).toBe('402 KB');
		expect(formatBytes(0)).toBe('0 KB');
	});

	test('renders megabytes with one decimal', () => {
		expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
		expect(formatBytes(1_572_864)).toBe('1.5 MB');
	});
});
