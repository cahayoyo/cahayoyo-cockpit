import { describe, expect, test } from 'bun:test';
import { moveRect, resizeRect } from './crop';

const VIEW = { w: 100, h: 100 };

describe('moveRect', () => {
	test('keeps the rect inside the view', () => {
		expect(moveRect({ x: 5, y: 5, w: 50, h: 50 }, 1000, -1000, VIEW.w, VIEW.h)).toEqual({
			x: 50,
			y: 0,
			w: 50,
			h: 50
		});
	});
});

describe('resizeRect', () => {
	test('free resize follows the corner', () => {
		expect(
			resizeRect({ x: 20, y: 20, w: 60, h: 40 }, 'nw', -10, 10, VIEW.w, VIEW.h, null, 10)
		).toEqual({ x: 10, y: 30, w: 70, h: 30 });
	});

	test('locked resize keeps the ratio', () => {
		expect(
			resizeRect({ x: 20, y: 20, w: 40, h: 40 }, 'se', 10, 100, VIEW.w, VIEW.h, 1, 24)
		).toEqual({ x: 20, y: 20, w: 50, h: 50 });
	});

	test('locked resize clamps to the view bounds', () => {
		expect(
			resizeRect({ x: 60, y: 60, w: 30, h: 30 }, 'se', 100, 100, VIEW.w, VIEW.h, 1, 24)
		).toEqual({ x: 60, y: 60, w: 40, h: 40 });
	});

	test('dragging past the anchor stops at the minimum size', () => {
		expect(
			resizeRect({ x: 10, y: 10, w: 50, h: 50 }, 'se', -100, -100, VIEW.w, VIEW.h, null, 24)
		).toEqual({ x: 10, y: 10, w: 24, h: 24 });
	});
});
