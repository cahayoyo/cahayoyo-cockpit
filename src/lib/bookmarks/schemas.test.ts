import { describe, expect, test } from 'bun:test';
import { MAX_UPLOAD_BYTES } from './upload';
import { bookmarkFormSchema, mediaUploadSchema } from './schemas';

const FOLDER_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

describe('bookmarkFormSchema', () => {
	test('accepts a valid bookmark and normalizes it', () => {
		const parsed = bookmarkFormSchema.parse({
			title: '  SvelteKit docs  ',
			url: 'https://svelte.dev/docs',
			description: '  Routing and layouts.  ',
			favorite: true,
			folderId: FOLDER_ID,
			imageId: null,
			tags: ' Svelte, docs, svelte '
		});

		expect(parsed).toEqual({
			title: 'SvelteKit docs',
			url: 'https://svelte.dev/docs',
			description: 'Routing and layouts.',
			favorite: true,
			folderId: FOLDER_ID,
			imageId: null,
			tags: ['svelte', 'docs']
		});
	});

	test('requires a title', () => {
		const base = {
			url: 'https://svelte.dev',
			description: '',
			favorite: false,
			folderId: null,
			imageId: null,
			tags: ''
		};
		expect(bookmarkFormSchema.safeParse({ ...base, title: '' }).success).toBe(false);
		expect(bookmarkFormSchema.safeParse({ ...base, title: '   ' }).success).toBe(false);
	});

	test('only accepts http and https urls', () => {
		const base = {
			title: 'x',
			description: '',
			favorite: false,
			folderId: null,
			imageId: null,
			tags: ''
		};
		for (const url of ['ftp://svelte.dev', 'javascript:alert(1)', 'svelte.dev', '']) {
			expect(bookmarkFormSchema.safeParse({ ...base, url }).success).toBe(false);
		}
		expect(bookmarkFormSchema.safeParse({ ...base, url: 'http://svelte.dev' }).success).toBe(true);
	});
});

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
