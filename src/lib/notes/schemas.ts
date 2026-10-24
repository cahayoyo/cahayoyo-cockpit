import { z } from 'zod';

// The title may be empty while a note is being renamed; the list shows the
// "Untitled" fallback for it, and an autosave must never fail on it.
export const noteFormSchema = z.object({
	title: z.string().trim().max(200, 'Title is too long.'),
	body: z.string(),
	folderId: z.uuid().nullable()
});

export type NoteFormInput = z.infer<typeof noteFormSchema>;
