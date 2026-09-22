import { error } from '@sveltejs/kit';
import { z } from 'zod';
import { getMediaFile } from '$lib/server/media';
import type { RequestHandler } from './$types';

const idSchema = z.uuid();

export const GET: RequestHandler = async ({ params }) => {
	const parsed = idSchema.safeParse(params.id);
	if (!parsed.success) {
		error(404, 'Not found');
	}

	const file = await getMediaFile(parsed.data);
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
