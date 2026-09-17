import { asc, eq } from 'drizzle-orm';
import type { FolderFormInput } from '$lib/folders/schemas';
import { db } from './db';
import { folder } from './db/schema';

export type FolderListItem = typeof folder.$inferSelect;

export async function listFolders(): Promise<FolderListItem[]> {
	return db.select().from(folder).orderBy(asc(folder.name));
}

export async function createFolder(input: FolderFormInput): Promise<string> {
	const [row] = await db
		.insert(folder)
		.values({ name: input.name, parentId: input.parentId })
		.returning({ id: folder.id });

	return row.id;
}

export async function renameFolder(id: string, name: string): Promise<void> {
	await db.update(folder).set({ name }).where(eq(folder.id, id));
}

export async function folderExists(id: string): Promise<boolean> {
	const [row] = await db.select({ id: folder.id }).from(folder).where(eq(folder.id, id));
	return row !== undefined;
}

export async function deleteFolder(id: string): Promise<void> {
	// Subtree removal and unfiling of contained items happen in the DB's FK
	// actions (folder.parent_id CASCADE, bookmark/note.folder_id SET NULL).
	await db.delete(folder).where(eq(folder.id, id));
}
