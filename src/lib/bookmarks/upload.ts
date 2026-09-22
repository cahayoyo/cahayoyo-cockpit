export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type UploadMimeType = (typeof UPLOAD_MIME_TYPES)[number];

const MEDIA_EXTENSIONS: Record<UploadMimeType, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

// Object key in the media bucket: `<uuid>.<ext>`. Kept stable so
// `media.storage_path` stays a valid object key (ADR-0004, no schema change).
export function mediaObjectKey(id: string, mimeType: UploadMimeType): string {
	return `${id}.${MEDIA_EXTENSIONS[mimeType]}`;
}

// Shared by the media picker (client) and the upload form action (server).
export function validateUpload(file: { type: string; size: number }): string | null {
	if (!(UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
		return 'Only JPEG, PNG, or WebP images are allowed.';
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		return 'Images must be 5 MB or smaller.';
	}

	return null;
}
