import { z } from 'zod';

// `z.guid()` (format-only), not `z.uuid()`: the Inbox id seeded by migration
// 0001 (`00000000-0000-0000-0000-000000000001`) is a valid database uuid but
// fails Zod 4's RFC 9562 version/variant check.
const idSchema = z.guid();

export function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

/** Optional UUID field: a missing, empty, or malformed value degrades to none. */
export function optionalId(formData: FormData, key: string): string | null {
	const parsed = idSchema.safeParse(text(formData, key));
	return parsed.success ? parsed.data : null;
}

/** UUID field that must be present; null when missing or malformed. */
export function requiredId(formData: FormData, key = 'id'): string | null {
	const parsed = idSchema.safeParse(text(formData, key));
	return parsed.success ? parsed.data : null;
}
