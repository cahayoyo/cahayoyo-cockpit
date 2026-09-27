import { describe, expect, test } from 'bun:test';
import { tagBadgeClass } from './tag-badges';

describe('tagBadgeClass', () => {
	test('is deterministic for the same tag name', () => {
		expect(tagBadgeClass('regression')).toBe(tagBadgeClass('regression'));
	});

	test('maps the empty name to the first palette color', () => {
		expect(tagBadgeClass('')).toBe('border-info/30 bg-info/10 text-info');
	});

	test('spreads tag names across every palette color', () => {
		const classes = new Set(
			Array.from({ length: 200 }, (_, index) => tagBadgeClass(`tag-${index}`))
		);
		expect(classes.size).toBe(5);
		expect(classes).toContain('border-info/30 bg-info/10 text-info');
	});
});
