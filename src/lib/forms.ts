import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';

export type ActionOutcome =
	{ ok: true; data: Record<string, unknown> } | { ok: false; message: string };

// Form actions report problems as `fail(400, { message })`; anything else is a bug.
export function failureMessage(data: unknown): string {
	return (data as { message?: string } | null | undefined)?.message ?? 'Something went wrong.';
}

// Most mutations run through <form use:enhance>; this calls a form action directly
// for interactions that only exist with JS (inline inputs, autosave, uploads).
// File/Blob values are supported for multipart boundaries (e.g. image uploads);
// `keepalive` lets a navigation flush finish after the page unloads.
export async function submitAction(
	action: string,
	values: Record<string, string | Blob>,
	options: { invalidate?: boolean; keepalive?: boolean } = {}
): Promise<ActionOutcome> {
	const body = new FormData();
	for (const [key, value] of Object.entries(values)) {
		body.append(key, value);
	}

	const response = await fetch(action, {
		method: 'POST',
		body,
		headers: { accept: 'application/json' },
		keepalive: options.keepalive ?? false
	});
	const result = deserialize(await response.text());

	if (options.invalidate !== false) {
		await invalidateAll();
	}

	if (result.type === 'success') {
		return { ok: true, data: result.data ?? {} };
	}

	if (result.type === 'failure') {
		return { ok: false, message: failureMessage(result.data) };
	}

	return {
		ok: false,
		message: result.type === 'error' ? result.error.message : 'Something went wrong.'
	};
}
