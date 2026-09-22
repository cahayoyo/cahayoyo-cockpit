import { z } from 'zod';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';

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

// Inverse of the URL half of the page state: the canonical query string for the
// selection. Defaults (no note, no search, root folder) are omitted, so a
// default state produces an empty string. The folder is view state only and is
// not consumed by the server.
export function buildNoteSearch(state: {
	noteId: string | null;
	q: string;
	folderId: string | null;
}): string {
	const parts: string[] = [];
	if (state.q) parts.push(`q=${encodeURIComponent(state.q)}`);
	if (state.folderId && state.folderId !== ROOT_FOLDER_ID) {
		parts.push(`folder=${state.folderId}`);
	}
	if (state.noteId) parts.push(`note=${state.noteId}`);

	return parts.join('&');
}
