import { fail, type RequestEvent } from '@sveltejs/kit';
import { folderFormSchema } from '$lib/folders/schemas';
import { optionalId, requiredId, text } from './form-data';
import { createFolder, deleteFolder, renameFolder } from './folders';
import { saveMedia } from './media';
import { requireUserId } from './session';

// Folder + media form actions are identical for every module that owns the shared
// folder tree (Bookmarks, Notes): one implementation, same validation and messages.
export const folderActions = {
	createFolder: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const parsed = folderFormSchema.safeParse({
			name: text(formData, 'name'),
			parentId: optionalId(formData, 'parentId')
		});

		if (!parsed.success) {
			return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid folder.' });
		}

		return { folderId: await createFolder(requireUserId(locals), parsed.data) };
	},

	renameFolder: async ({ request }: RequestEvent) => {
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

	deleteFolder: async ({ request }: RequestEvent) => {
		const id = requiredId(await request.formData());
		if (!id) {
			return fail(400, { message: 'Invalid folder.' });
		}

		await deleteFolder(id);
		return { deleted: true };
	},

	uploadMedia: async ({ request, locals }: RequestEvent) => {
		const file = (await request.formData()).get('file');
		if (!(file instanceof File)) {
			return fail(400, { message: 'Choose an image to upload.' });
		}

		const saved = await saveMedia(requireUserId(locals), file);
		if (!saved.ok) {
			return fail(400, { message: saved.error });
		}

		return { mediaId: saved.media.id };
	}
};
