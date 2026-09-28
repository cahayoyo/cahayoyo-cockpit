import { and, asc, eq } from 'drizzle-orm';
import type { FolderFormInput } from '$lib/folders/schemas';
import { db } from './db';
import { folder, folderKind } from './db/schema';

export type FolderListItem = typeof folder.$inferSelect;
export type FolderKind = (typeof folderKind.enumValues)[number];

export async function listFolders(ownerId: string, kind: FolderKind): Promise<FolderListItem[]> {
	return db
		.select()
		.from(folder)
		.where(and(eq(folder.ownerId, ownerId), eq(folder.kind, kind)))
		.orderBy(asc(folder.name));
}

export async function createFolder(
	ownerId: string,
	input: FolderFormInput,
	kind: FolderKind
): Promise<string | null> {
	// A crafted parentId must not file the folder under another account's tree —
	// or under another module's tree.
	if (input.parentId !== null && !(await folderExists(ownerId, input.parentId, kind))) {
		return null;
	}

	const [row] = await db
		.insert(folder)
		.values({ name: input.name, parentId: input.parentId, ownerId, kind })
		.returning({ id: folder.id });

	return row.id;
}

export async function renameFolder(
	ownerId: string,
	id: string,
	name: string,
	kind: FolderKind
): Promise<boolean> {
	const [updated] = await db
		.update(folder)
		.set({ name })
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId), eq(folder.kind, kind)))
		.returning({ id: folder.id });

	return updated !== undefined;
}

export async function folderExists(
	ownerId: string,
	id: string,
	kind: FolderKind
): Promise<boolean> {
	const [row] = await db
		.select({ id: folder.id })
		.from(folder)
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId), eq(folder.kind, kind)));

	return row !== undefined;
}

export async function deleteFolder(
	ownerId: string,
	id: string,
	kind: FolderKind
): Promise<boolean> {
	// Subtree removal and unfiling of contained items happen in the DB's FK
	// actions (folder.parent_id CASCADE, bookmark/note.folder_id SET NULL).
	const [deleted] = await db
		.delete(folder)
		.where(and(eq(folder.id, id), eq(folder.ownerId, ownerId), eq(folder.kind, kind)))
		.returning({ id: folder.id });

	return deleted !== undefined;
}
