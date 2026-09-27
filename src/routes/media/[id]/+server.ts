import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { getMediaFile } from '$lib/server/media';
import { requireUserId } from '$lib/server/session';
import type { RequestHandler } from './$types';

const idSchema = z.uuid();

export const GET: RequestHandler = async ({ params, locals }) => {
	const parsed = idSchema.safeParse(params.id);
	if (!parsed.success) {
		error(404, 'Not found');
	}

	// Owner-scoped: another account's image id resolves to nothing.
	const file = await getMediaFile(requireUserId(locals), parsed.data);
	if (!file) {
		error(404, 'Not found');
	}

	return new Response(file.body, {
		headers: {
			'content-type': file.mimeType,
			'cache-control': 'private, max-age=31536000, immutable'
		}
	});
};
