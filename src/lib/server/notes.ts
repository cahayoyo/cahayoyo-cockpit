import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { likePattern, noteSnippet, sortNotes } from '$lib/notes/list';
import type { NoteFormInput } from '$lib/notes/schemas';
import { db } from './db';
import { note } from './db/schema';

export type NoteListItem = typeof note.$inferSelect & { snippet: string };

const UNTITLED = 'Untitled';

// A non-empty query is the global search: it matches titles and bodies
// case-insensitively and ignores the folder scope.
export async function listNotes(ownerId: string, query = ''): Promise<NoteListItem[]> {
	const term = query.trim();
	const rows = await db
		.select()
		.from(note)
		.where(
			and(
				eq(note.ownerId, ownerId),
				term === ''
					? undefined
					: or(ilike(note.title, likePattern(term)), ilike(note.body, likePattern(term)))
			)
		);

	return sortNotes(rows).map((row) => ({
		...row,
		snippet: noteSnippet(row.body)
	}));
}

export async function getNote(ownerId: string, id: string): Promise<NoteListItem | null> {
	const [row] = await db
		.select()
		.from(note)
		.where(and(eq(note.id, id), eq(note.ownerId, ownerId)));

	if (!row) {
		return null;
	}

	return { ...row, snippet: noteSnippet(row.body) };
}

export async function createNote(ownerId: string, folderId: string | null = null): Promise<string> {
	const [row] = await db
		.insert(note)
		.values({ title: UNTITLED, body: '', folderId, ownerId })
		.returning({ id: note.id });

	return row.id;
}

export async function updateNote(
	ownerId: string,
	id: string,
	input: NoteFormInput
): Promise<Date | null> {
	const updated = await db
		.update(note)
		.set({ title: input.title, body: input.body, folderId: input.folderId })
		.where(and(eq(note.id, id), eq(note.ownerId, ownerId)))
		.returning({ id: note.id, updatedAt: note.updatedAt });

	return updated.length === 0 ? null : updated[0].updatedAt;
}

export async function setNotePinned(
	ownerId: string,
	id: string,
	pinned: boolean
): Promise<boolean> {
	// Pinning is metadata: it must not touch updated_at (the list's sort key),
	// so unpinning does not jump the note back to the top of the list.
	const [updated] = await db
		.update(note)
		.set({ pinned, updatedAt: sql`${note.updatedAt}` })
		.where(and(eq(note.id, id), eq(note.ownerId, ownerId)))
		.returning({ id: note.id });

	return updated !== undefined;
}

export async function deleteNote(ownerId: string, id: string): Promise<boolean> {
	// note_tag rows go with the note via ON DELETE CASCADE.
	const [deleted] = await db
		.delete(note)
		.where(and(eq(note.id, id), eq(note.ownerId, ownerId)))
		.returning({ id: note.id });

	return deleted !== undefined;
}
