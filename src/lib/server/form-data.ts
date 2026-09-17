import { z } from 'zod';

const idSchema = z.uuid();

export function text(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

/** Field that may be absent ('' = none) but must be a UUID when present. */
export function optionalId(formData: FormData, key: string): string | null {
	const value = text(formData, key);
	return value === '' ? null : value;
}

/** UUID field that must be present; null when missing or malformed. */
export function requiredId(formData: FormData, key = 'id'): string | null {
	const parsed = idSchema.safeParse(text(formData, key));
	return parsed.success ? parsed.data : null;
}
