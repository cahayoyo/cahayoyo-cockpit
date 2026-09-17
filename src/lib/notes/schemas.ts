import { z } from 'zod';
import { parseTags } from '$lib/tags';

// The title may be empty while a note is being renamed; the list shows the
// "Untitled" fallback for it, and an autosave must never fail on it.
export const noteFormSchema = z.object({
	title: z.string().trim().max(200, 'Title is too long.'),
	body: z.string(),
	folderId: z.uuid().nullable(),
	tags: z.string().transform(parseTags)
});

export type NoteFormInput = z.infer<typeof noteFormSchema>;
