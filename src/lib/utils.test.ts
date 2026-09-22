/// <reference types="bun" />
import { describe, expect, it } from 'bun:test';
import { cn } from './utils';

describe('cn', () => {
	it('merges conflicting classes, keeping the last', () => {
		expect(cn('p-2', 'p-4')).toBe('p-4');
	});

	it('drops falsy values', () => {
		expect(cn('text-sm', false, undefined, 'font-medium')).toBe('text-sm font-medium');
	});
});
