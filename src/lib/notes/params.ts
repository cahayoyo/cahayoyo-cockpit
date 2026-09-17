import { z } from 'zod';

export const noteSearchSchema = z.object({
	note: z.uuid().catch(''),
	q: z.string().trim().catch('')
});

export type NoteSearch = {
	noteId: string | null;
	q: string;
};

// Unknown or malformed params degrade to the safe default: no selected note,
// no search. Search is always global (it ignores the folder scope).
export function parseNoteSearch(params: URLSearchParams): NoteSearch {
	const parsed = noteSearchSchema.parse({
		note: params.get('note') ?? '',
		q: params.get('q') ?? ''
	});

	return { noteId: parsed.note || null, q: parsed.q };
}
