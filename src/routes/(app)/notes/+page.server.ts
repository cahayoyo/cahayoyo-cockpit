import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { parseNoteSearch } from '$lib/notes/params';
import { noteFormSchema } from '$lib/notes/schemas';
import { folderActions } from '$lib/server/folder-actions';
import { optionalId, requiredId, text } from '$lib/server/form-data';
import { folderExists, listFolders } from '$lib/server/folders';
import {
	createNote,
	deleteNote,
	getNote,
	listNotes,
	setNotePinned,
	updateNote
} from '$lib/server/notes';
import { requireUserId } from '$lib/server/session';
import { listTagNames } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

const pinnedSchema = z.enum(['true', 'false']);

export const load: PageServerLoad = async ({ url, locals }) => {
	const ownerId = requireUserId(locals);
	const { noteId, q } = parseNoteSearch(url.searchParams);
	const [notes, folders, tags] = await Promise.all([
		listNotes(ownerId, q),
		listFolders(ownerId, 'note'),
		listTagNames(ownerId)
	]);

	// The selected note is normally in the list; an active search can exclude it,
	// so the editor keeps its note by fetching it separately (deep links too).
	const activeNote = noteId
		? (notes.find((item) => item.id === noteId) ?? (await getNote(ownerId, noteId)))
		: null;

	return { q, notes, activeNote, folders, tags };
};

export const actions: Actions = {
	...folderActions('note'),

	createNote: async ({ request, locals }) => {
		const ownerId = requireUserId(locals);
		const folderId = optionalId(await request.formData(), 'folderId');
		if (folderId && !(await folderExists(ownerId, folderId, 'note'))) {
			return fail(400, { message: 'That folder no longer exists. Pick another one.' });
		}

		return { noteId: await createNote(ownerId, folderId) };
	},

	saveNote: async ({ request, locals }) => {
		const ownerId = requireUserId(locals);
		const formData = await request.formData();
		const id = requiredId(formData);
		if (!id) {
			return fail(400, { message: 'Invalid note.' });
		}

		const parsed = noteFormSchema.safeParse({
			title: text(formData, 'title'),
			body: text(formData, 'body'),
			folderId: optionalId(formData, 'folderId'),
			tags: text(formData, 'tags')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid note.' });
		}

		// An editor that still points at a folder deleted elsewhere must fail cleanly
		// instead of tripping the foreign key on write.
		if (parsed.data.folderId && !(await folderExists(ownerId, parsed.data.folderId, 'note'))) {
			return fail(400, { message: 'That folder no longer exists. Pick another one.' });
		}

		const savedAt = await updateNote(ownerId, id, parsed.data);
		if (!savedAt) {
			return fail(404, { message: 'This note no longer exists.' });
		}

		return { saved: true, savedAt: savedAt.toISOString() };
	},

	deleteNote: async ({ request, locals }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid note.' });
		}

		if (!(await deleteNote(requireUserId(locals), id))) {
			return fail(404, { message: 'This note no longer exists.' });
		}

		return { deleted: true };
	},

	togglePin: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const pinned = pinnedSchema.safeParse(text(formData, 'pinned'));
		if (!id || !pinned.success) {
			return fail(400, { message: 'Invalid note.' });
		}

		if (!(await setNotePinned(requireUserId(locals), id, pinned.data === 'true'))) {
			return fail(404, { message: 'This note no longer exists.' });
		}

		return { toggled: true };
	}
};
