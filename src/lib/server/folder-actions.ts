import { fail, type RequestEvent } from '@sveltejs/kit';
import { folderFormSchema } from '$lib/folders/schemas';
import { optionalId, requiredId, text } from './form-data';
import { createFolder, deleteFolder, renameFolder, type FolderKind } from './folders';
import { saveMedia } from './media';
import { requireUserId } from './session';

// Folder + media form actions for a module that owns a folder tree (Notes): one
// factory, same validation and messages, scoped to the module's kind.
export function folderActions(kind: FolderKind) {
	return {
		createFolder: async ({ request, locals }: RequestEvent) => {
			const formData = await request.formData();
			const parsed = folderFormSchema.safeParse({
				name: text(formData, 'name'),
				parentId: optionalId(formData, 'parentId')
			});

			if (!parsed.success) {
				return fail(400, { message: parsed.error.issues[0]?.message ?? 'Invalid folder.' });
			}

			const folderId = await createFolder(requireUserId(locals), parsed.data, kind);
			if (!folderId) {
				return fail(400, { message: 'That folder no longer exists. Pick another one.' });
			}

			return { folderId };
		},

		renameFolder: async ({ request, locals }: RequestEvent) => {
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

			if (!(await renameFolder(requireUserId(locals), id, parsed.data.name, kind))) {
				return fail(404, { message: 'This folder no longer exists.' });
			}

			return { renamed: true };
		},

		deleteFolder: async ({ request, locals }: RequestEvent) => {
			const id = requiredId(await request.formData());
			if (!id) {
				return fail(400, { message: 'Invalid folder.' });
			}

			if (!(await deleteFolder(requireUserId(locals), id, kind))) {
				return fail(404, { message: 'This folder no longer exists.' });
			}

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
}
