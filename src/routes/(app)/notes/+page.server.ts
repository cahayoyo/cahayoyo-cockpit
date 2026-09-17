import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { folderFormSchema } from '$lib/folders/schemas';
import { parseNoteSearch } from '$lib/notes/params';
import { noteFormSchema } from '$lib/notes/schemas';
import { optionalId, requiredId, text } from '$lib/server/form-data';
import {
	createFolder,
	deleteFolder,
	folderExists,
	listFolders,
	renameFolder
} from '$lib/server/folders';
import { saveMedia } from '$lib/server/media';
import {
	createNote,
	deleteNote,
	getNote,
	listNotes,
	setNotePinned,
	updateNote
} from '$lib/server/notes';
import { listTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

const pinnedSchema = z.enum(['true', 'false']);

export const load: PageServerLoad = async ({ url }) => {
	const { noteId, q } = parseNoteSearch(url.searchParams);
	const [notes, folders, tags] = await Promise.all([listNotes(q), listFolders(), listTags()]);

	// The selected note is normally in the list; an active search can exclude it,
	// so the editor keeps its note by fetching it separately (deep links too).
	const activeNote = noteId
		? (notes.find((item) => item.id === noteId) ?? (await getNote(noteId)))
		: null;

	return { q, notes, activeNote, folders, tags };
};

export const actions: Actions = {
	createNote: async ({ request }) => {
		const folderId = optionalId(await request.formData(), 'folderId');
		return { noteId: await createNote(folderId) };
	},

	saveNote: async ({ request }) => {
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
		if (parsed.data.folderId && !(await folderExists(parsed.data.folderId))) {
			return fail(400, { message: 'That folder no longer exists. Pick another one.' });
		}

		const savedAt = await updateNote(id, parsed.data);
		if (!savedAt) {
			return fail(404, { message: 'This note no longer exists.' });
		}

		return { saved: true, savedAt: savedAt.toISOString() };
	},

	deleteNote: async ({ request }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid note.' });
		}

		await deleteNote(id);
		return { deleted: true };
	},

	togglePin: async ({ request }) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const pinned = pinnedSchema.safeParse(text(formData, 'pinned'));
		if (!id || !pinned.success) {
			return fail(400, { message: 'Invalid note.' });
		}

		await setNotePinned(id, pinned.data === 'true');
		return { toggled: true };
	},

	createFolder: async ({ request }) => {
		const formData = await request.formData();
		const parsed = folderFormSchema.safeParse({
			name: text(formData, 'name'),
			parentId: optionalId(formData, 'parentId')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid folder.' });
		}

		return { folderId: await createFolder(parsed.data) };
	},

	renameFolder: async ({ request }) => {
		const formData = await request.formData();
		const parsed = folderFormSchema
			.pick({ name: true })
			.safeParse({ name: text(formData, 'name') });
		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid folder.' });
		}

		const id = requiredId(formData);
		if (!id) {
			return fail(400, { message: 'Invalid folder.' });
		}

		await renameFolder(id, parsed.data.name);
		return { renamed: true };
	},

	deleteFolder: async ({ request }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid folder.' });
		}

		await deleteFolder(id);
		return { deleted: true };
	},

	uploadMedia: async ({ request }) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File)) {
			return fail(400, { message: 'Choose an image to upload.' });
		}

		const saved = await saveMedia(file);
		if (!saved.ok) {
			return fail(400, { message: saved.error });
		}

		return { mediaId: saved.media.id };
	}
};
