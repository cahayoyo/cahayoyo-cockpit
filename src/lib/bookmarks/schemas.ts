import { z } from 'zod';
import { parseTags } from '$lib/tags';
import { validateUpload } from './upload';

export const bookmarkFormSchema = z.object({
	title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.'),
	url: z.url({ protocol: /^https?$/ }).max(2048, 'URL is too long.'),
	description: z.string().trim().max(2000, 'Description is too long.'),
	favorite: z.boolean(),
	folderId: z.uuid().nullable(),
	imageId: z.uuid().nullable(),
	tags: z.string().transform(parseTags)
});

export type BookmarkFormInput = z.infer<typeof bookmarkFormSchema>;

export const mediaUploadSchema = z.file().superRefine((file, ctx) => {
	const error = validateUpload(file);
	if (error) {
		ctx.addIssue({ code: 'custom', message: error });
	}
});
