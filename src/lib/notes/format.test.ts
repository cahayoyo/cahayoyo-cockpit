import { describe, expect, test } from 'bun:test';
import { formatRelativeTime, formatTime } from './format';

describe('formatRelativeTime', () => {
	// Instants are UTC; Asia/Jakarta is UTC+7, so the app-zone calendar date is
	// the one the label must follow.
	const now = new Date('2026-09-27T04:00:00Z'); // 2026-09-27 11:00 WIB

	test('renders today as "Today, HH:mm" in the app zone', () => {
		expect(formatRelativeTime(new Date('2026-09-27T04:24:00Z'), now)).toBe('Today, 11:24');
	});

	test('renders yesterday as "Yesterday, HH:mm" in the app zone', () => {
		expect(formatRelativeTime(new Date('2026-09-26T09:32:00Z'), now)).toBe('Yesterday, 16:32');
	});

	test('renders older dates as "Mon D, YYYY"', () => {
		expect(formatRelativeTime(new Date('2025-09-20T03:00:00Z'), now)).toBe('Sep 20, 2025');
	});

	test('compares calendar days in the app zone, not UTC', () => {
		// 2026-09-27 18:00 UTC is 2026-09-28 01:00 WIB — already "tomorrow" for
		// the app, so 23:00 WIB on the 27th must read as Yesterday.
		const lateNow = new Date('2026-09-27T18:00:00Z');
		expect(formatRelativeTime(new Date('2026-09-27T16:00:00Z'), lateNow)).toBe('Yesterday, 23:00');
	});

	test('renders midnight as 00:05, never 24:05', () => {
		expect(
			formatRelativeTime(new Date('2026-09-27T17:05:00Z'), new Date('2026-09-27T17:30:00Z'))
		).toBe('Today, 00:05');
	});
});

describe('formatTime', () => {
	test('renders HH:mm with zero padding', () => {
		expect(formatTime(new Date(2026, 0, 5, 14, 32))).toBe('14:32');
		expect(formatTime(new Date(2026, 0, 5, 9, 5))).toBe('09:05');
	});
});
