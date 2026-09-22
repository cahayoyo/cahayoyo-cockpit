// Pure crop-frame geometry for the media picker's crop dialog (ImageCropDialog).
export type CropRect = { x: number; y: number; w: number; h: number };
export type CropCorner = 'nw' | 'ne' | 'sw' | 'se';

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function moveRect(
	orig: CropRect,
	dx: number,
	dy: number,
	viewW: number,
	viewH: number
): CropRect {
	return {
		...orig,
		x: clamp(orig.x + dx, 0, viewW - orig.w),
		y: clamp(orig.y + dy, 0, viewH - orig.h)
	};
}

// `ratio` = w/h to keep while resizing; null = free resize.
export function resizeRect(
	orig: CropRect,
	corner: CropCorner,
	dx: number,
	dy: number,
	viewW: number,
	viewH: number,
	ratio: number | null,
	min: number
): CropRect {
	const anchorX = corner === 'nw' || corner === 'sw' ? orig.x + orig.w : orig.x;
	const anchorY = corner === 'nw' || corner === 'ne' ? orig.y + orig.h : orig.y;
	const wMax = corner === 'nw' || corner === 'sw' ? anchorX : viewW - anchorX;
	const hMax = corner === 'nw' || corner === 'ne' ? anchorY : viewH - anchorY;
	const movingX = (corner === 'nw' || corner === 'sw' ? orig.x : orig.x + orig.w) + dx;
	const movingY = (corner === 'nw' || corner === 'ne' ? orig.y : orig.y + orig.h) + dy;

	let w = clamp(
		corner === 'nw' || corner === 'sw' ? anchorX - movingX : movingX - anchorX,
		min,
		wMax
	);
	let h = clamp(
		corner === 'nw' || corner === 'ne' ? anchorY - movingY : movingY - anchorY,
		min,
		hMax
	);
	if (ratio) {
		h = clamp(w / ratio, min, hMax);
		w = Math.min(h * ratio, wMax);
	}

	return {
		x: corner === 'nw' || corner === 'sw' ? anchorX - w : anchorX,
		y: corner === 'nw' || corner === 'ne' ? anchorY - h : anchorY,
		w,
		h
	};
}
