import { and, asc, eq } from 'drizzle-orm';
import type { FolderFormInput } from '$lib/folders/schemas';
import { db } from './db';
import { folder } from './db/schema';

export type FolderListItem = typeof folder.$inferSelect;

export async function listFolders(ownerId: string): Promise<FolderListItem[]> {
	return db.select().from(folder).where(eq(folder.ownerId, ownerId)).orderBy(asc(folder.name));
}

export async function createFolder(
	ownerId: string,
	input: FolderFormInput
): Promise<string | null> {
	// A crafted parentId must not file the folder under another account's tree.
	if (input.parentId !== null && !(await folderExists(ownerId, input.parentId))) {
		return null;
	}

	const [row] = await db
		.insert(folder)
		.values({ name: input.name, parentId: input.parentId, ownerId })
		.returning({ id: folder.id });

	return row.id;
}

export async function renameFolder(ownerId: string, id: string, name: string): Promise<boolean> {
	const [updated] = await db
		.update(folder)
		.set({ name })
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId)))
		.returning({ id: folder.id });

	return updated !== undefined;
}

export async function folderExists(ownerId: string, id: string): Promise<boolean> {
	const [row] = await db
		.select({ id: folder.id })
		.from(folder)
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId)));

	return row !== undefined;
}

export async function deleteFolder(ownerId: string, id: string): Promise<boolean> {
	// Subtree removal and unfiling of contained items happen in the DB's FK
	// actions (folder.parent_id CASCADE, bookmark/note.folder_id SET NULL).
	const [deleted] = await db
		.delete(folder)
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId)))
		.returning({ id: folder.id });

	return deleted !== undefined;
}
