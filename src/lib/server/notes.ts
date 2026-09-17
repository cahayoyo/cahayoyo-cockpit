import { asc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { likePattern, noteSnippet, sortNotes } from '$lib/notes/list';
import type { NoteFormInput } from '$lib/notes/schemas';
import { groupTagNames } from '$lib/tags';
import type { Transaction } from './db';
import { db } from './db';
import { note, noteTag, tag } from './db/schema';
import { ensureTagIds } from './tags';

export type NoteListItem = typeof note.$inferSelect & { tags: string[]; snippet: string };

const UNTITLED = 'Untitled';

// A non-empty query is the global search: it matches titles and bodies
// case-insensitively and ignores the folder scope.
export async function listNotes(query = ''): Promise<NoteListItem[]> {
	const term = query.trim();
	const rows = await db
		.select()
		.from(note)
		.where(
			term === ''
				? undefined
				: or(ilike(note.title, likePattern(term)), ilike(note.body, likePattern(term)))
		);

	if (rows.length === 0) {
		return [];
	}

	const links = await db
		.select({ id: noteTag.noteId, name: tag.name })
		.from(noteTag)
		.innerJoin(tag, eq(noteTag.tagId, tag.id))
		.where(
			inArray(
				noteTag.noteId,
				rows.map((row) => row.id)
			)
		)
		.orderBy(asc(tag.name));

	const tagsByNote = groupTagNames(links);

	return sortNotes(rows).map((row) => ({
		...row,
		tags: tagsByNote.get(row.id) ?? [],
		snippet: noteSnippet(row.body)
	}));
}

export async function createNote(folderId: string | null = null): Promise<string> {
	const [row] = await db
		.insert(note)
		.values({ title: UNTITLED, body: '', folderId })
		.returning({ id: note.id });

	return row.id;
}

async function attachTags(tx: Transaction, noteId: string, names: string[]): Promise<void> {
	const tagIds = await ensureTagIds(tx, names);
	if (tagIds.length === 0) {
		return;
	}

	await tx.insert(noteTag).values(tagIds.map((tagId) => ({ noteId, tagId })));
}

export async function updateNote(id: string, input: NoteFormInput): Promise<boolean> {
	return db.transaction(async (tx) => {
		const updated = await tx
			.update(note)
			.set({ title: input.title, body: input.body, folderId: input.folderId })
			.where(eq(note.id, id))
			.returning({ id: note.id });

		if (updated.length === 0) {
			return false;
		}

		await tx.delete(noteTag).where(eq(noteTag.noteId, id));
		await attachTags(tx, id, input.tags);
		return true;
	});
}

export async function setNotePinned(id: string, pinned: boolean): Promise<void> {
	// Pinning is metadata: it must not touch updated_at (the list's sort key),
	// so unpinning does not jump the note back to the top of the list.
	await db
		.update(note)
		.set({ pinned, updatedAt: sql`${note.updatedAt}` })
		.where(eq(note.id, id));
}

export async function deleteNote(id: string): Promise<void> {
	// note_tag rows go with the note via ON DELETE CASCADE.
	await db.delete(note).where(eq(note.id, id));
}
