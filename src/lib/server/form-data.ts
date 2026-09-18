import { dbIdSchema } from '$lib/ids';

export function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

/** Optional UUID field: a missing, empty, or malformed value degrades to none. */
export function optionalId(formData: FormData, key: string): string | null {
	const parsed = dbIdSchema.safeParse(text(formData, key));
	return parsed.success ? parsed.data : null;
}

/** UUID field that must be present; null when missing or malformed. */
export function requiredId(formData: FormData, key = 'id'): string | null {
	const parsed = dbIdSchema.safeParse(text(formData, key));
	return parsed.success ? parsed.data : null;
}
