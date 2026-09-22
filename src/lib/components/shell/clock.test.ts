import { describe, expect, test } from 'bun:test';
import { formatClock } from './clock';

describe('formatClock', () => {
	test('formats date and 24h time with zero padding', () => {
		expect(formatClock(new Date(2026, 8, 14, 21, 30, 45))).toBe('2026-09-14 - 21:30:45');
	});

	test('pads single-digit day and time parts', () => {
		expect(formatClock(new Date(2026, 0, 3, 4, 5, 6))).toBe('2026-01-03 - 04:05:06');
	});

	test('uses 24h midnight and noon', () => {
		expect(formatClock(new Date(2026, 11, 31, 0, 0, 0))).toBe('2026-12-31 - 00:00:00');
		expect(formatClock(new Date(2026, 11, 31, 12, 0, 0))).toBe('2026-12-31 - 12:00:00');
	});
});
