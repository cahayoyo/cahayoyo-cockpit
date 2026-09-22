import { describe, expect, test } from 'bun:test';
import { MAX_UPLOAD_BYTES, mediaObjectKey, validateUpload } from './upload';

describe('validateUpload', () => {
	test('accepts jpeg, png, and webp within the size limit', () => {
		expect(validateUpload({ type: 'image/jpeg', size: 1024 })).toBeNull();
		expect(validateUpload({ type: 'image/png', size: 1024 })).toBeNull();
		expect(validateUpload({ type: 'image/webp', size: 1024 })).toBeNull();
	});

	test('accepts a file exactly at the size limit', () => {
		expect(validateUpload({ type: 'image/png', size: MAX_UPLOAD_BYTES })).toBeNull();
	});

	test('rejects other mime types', () => {
		expect(validateUpload({ type: 'image/gif', size: 1024 })).toBe(
			'Only JPEG, PNG, or WebP images are allowed.'
		);
		expect(validateUpload({ type: 'image/svg+xml', size: 1024 })).toBe(
			'Only JPEG, PNG, or WebP images are allowed.'
		);
	});

	test('rejects files over the size limit', () => {
		expect(validateUpload({ type: 'image/png', size: MAX_UPLOAD_BYTES + 1 })).toBe(
			'Images must be 5 MB or smaller.'
		);
	});
});

describe('mediaObjectKey', () => {
	test('names the object <uuid>.<ext> per mime type', () => {
		const id = '7c9f4a1e-2b3d-4e5f-8a9b-0c1d2e3f4a5b';
		expect(mediaObjectKey(id, 'image/jpeg')).toBe(`${id}.jpg`);
		expect(mediaObjectKey(id, 'image/png')).toBe(`${id}.png`);
		expect(mediaObjectKey(id, 'image/webp')).toBe(`${id}.webp`);
	});
});
