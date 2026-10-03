import { describe, expect, test } from 'bun:test';
import { MAX_UPLOAD_BYTES } from './upload';
import { mediaUploadSchema } from './schemas';

describe('mediaUploadSchema', () => {
	test('accepts an allowed mime type within the size limit', () => {
		const file = new File([new Uint8Array(1024)], 'shot.png', { type: 'image/png' });
		expect(mediaUploadSchema.safeParse(file).success).toBe(true);
	});

	test('rejects a disallowed mime type', () => {
		const file = new File([new Uint8Array(1024)], 'anim.gif', { type: 'image/gif' });
		expect(mediaUploadSchema.safeParse(file).success).toBe(false);
	});

	test('rejects files over the size limit', () => {
		const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'big.png', {
			type: 'image/png'
		});
		expect(mediaUploadSchema.safeParse(file).success).toBe(false);
	});
});
