import { describe, expect, test } from 'bun:test';
import { formatDateTime, formatTime } from './format';

describe('formatDateTime', () => {
	test('renders YYYY-MM-DD HH:mm with zero padding', () => {
		expect(formatDateTime(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05 09:07');
	});

	test('pads midnight to 00:00', () => {
		expect(formatDateTime(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31 00:00');
	});
});

describe('formatTime', () => {
	test('renders HH:mm with zero padding', () => {
		expect(formatTime(new Date(2026, 0, 5, 14, 32))).toBe('14:32');
		expect(formatTime(new Date(2026, 0, 5, 9, 5))).toBe('09:05');
	});
});
