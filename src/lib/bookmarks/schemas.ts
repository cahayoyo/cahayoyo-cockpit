import { z } from 'zod';
import { validateUpload } from './upload';

export const mediaUploadSchema = z.file().superRefine((file, ctx) => {
	const error = validateUpload(file);
	if (error) {
		ctx.addIssue({ code: 'custom', message: error });
	}
});
