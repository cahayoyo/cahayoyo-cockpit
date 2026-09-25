import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { filterBookmarks } from '$lib/bookmarks/filters';
import { parseBookmarkSearch, parseBookmarkView } from '$lib/bookmarks/params';
import { bookmarkFormSchema } from '$lib/bookmarks/schemas';
import { ROOT_FOLDER_ID } from '$lib/folders/tree';
import {
	createBookmark,
	deleteBookmark,
	listBookmarks,
	setBookmarkFavorite,
	updateBookmark
} from '$lib/server/bookmarks';
import { folderActions } from '$lib/server/folder-actions';
import { optionalId, requiredId, text } from '$lib/server/form-data';
import { listFolders } from '$lib/server/folders';
import { deleteMedia, getMediaFile, listMedia } from '$lib/server/media';
import { requireUserId } from '$lib/server/session';
import { listTags } from '$lib/server/tags';
import type { Actions, PageServerLoad } from './$types.js';

const idSchema = z.uuid();
const favoriteSchema = z.enum(['true', 'false']);

export const load: PageServerLoad = async ({ url }) => {
	const filters = parseBookmarkSearch(url.searchParams);
	const [bookmarks, folders, tags, media] = await Promise.all([
		listBookmarks(),
		listFolders(),
		listTags(),
		listMedia()
	]);

	// A folder that no longer exists (deleted elsewhere, stale link) degrades to the root.
	const match = folders.find((folder) => folder.id === filters.folderId);
	const folderId = match ? match.id : ROOT_FOLDER_ID;
	const scope = { ...filters, folderId };

	return {
		view: parseBookmarkView(url.searchParams),
		filters: scope,
		items: filterBookmarks(bookmarks, scope),
		folders,
		tags,
		media
	};
};

export const actions: Actions = {
	...folderActions,

	saveBookmark: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = bookmarkFormSchema.safeParse({
			title: text(formData, 'title'),
			url: text(formData, 'url'),
			description: text(formData, 'description'),
			favorite: formData.get('favorite') === 'on',
			folderId: optionalId(formData, 'folderId'),
			imageId: optionalId(formData, 'imageId'),
			tags: text(formData, 'tags')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid bookmark.' });
		}

		// The picker can delete an unreferenced image the draft still points at; the
		// media FK would reject the insert, so check before writing.
		if (parsed.data.imageId) {
			const file = await getMediaFile(parsed.data.imageId);
			if (!file) {
				return fail(400, { message: 'That image no longer exists. Pick another one.' });
			}
		}

		const id = text(formData, 'id');
		if (id === '') {
			await createBookmark(requireUserId(locals), parsed.data);
			return { saved: true };
		}

		const parsedId = idSchema.safeParse(id);
		if (!parsedId.success) {
			return fail(400, { message: 'Invalid bookmark.' });
		}

		const updated = await updateBookmark(requireUserId(locals), parsedId.data, parsed.data);
		if (!updated) {
			return fail(404, { message: 'This bookmark no longer exists.' });
		}

		return { saved: true };
	},

	deleteBookmark: async ({ request }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid bookmark.' });
		}

		await deleteBookmark(id);
		return { deleted: true };
	},

	toggleFavorite: async ({ request }) => {
		const formData = await request.formData();
		const id = requiredId(formData);
		const favorite = favoriteSchema.safeParse(text(formData, 'favorite'));
		if (!id || !favorite.success) {
			return fail(400, { message: 'Invalid bookmark.' });
		}

		await setBookmarkFavorite(id, favorite.data === 'true');
		return { toggled: true };
	},

	deleteMedia: async ({ request }) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid image.' });
		}

		const result = await deleteMedia(id);
		if (!result.ok) {
			const usedBy = [
				result.bookmarkCount > 0
					? `${result.bookmarkCount} bookmark${result.bookmarkCount === 1 ? '' : 's'}`
					: '',
				result.noteCount > 0 ? `${result.noteCount} note${result.noteCount === 1 ? '' : 's'}` : ''
			].filter(Boolean);

			return fail(409, {
				message: `This image is used by ${usedBy.join(' and ')} and cannot be deleted.`
			});
		}

		return { deleted: true };
	}
};
