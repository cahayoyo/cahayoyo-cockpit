import { describe, expect, test } from 'bun:test';
import { addDaysIso, dateInAppZone } from './today';

describe('dateInAppZone', () => {
	test('formats a UTC instant in the app timezone (Asia/Jakarta, UTC+7)', () => {
		expect(dateInAppZone(new Date('2026-09-18T05:00:00Z'))).toBe('2026-09-18');
		expect(dateInAppZone(new Date('2026-09-18T18:30:00Z'))).toBe('2026-09-19');
	});
});

describe('addDaysIso', () => {
	test('adds days across month and year boundaries', () => {
		expect(addDaysIso('2026-09-18', 7)).toBe('2026-09-25');
		expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31');
	});
});
