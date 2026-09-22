// Virtual root scope shared by every module that files into the folder tree.
// The root is not a row in `folder`: top-level folders have no parent and
// unfiled items (`folder_id IS NULL`) render in it.
export const ROOT_FOLDER_ID = 'root';

export type FolderRow = {
	id: string;
	name: string;
	parentId: string | null;
};

export type FolderNode = FolderRow & { children: FolderNode[] };

export function buildFolderTree(folders: readonly FolderRow[]): FolderNode[] {
	const nodes = new Map<string, FolderNode>(
		folders.map((folder) => [folder.id, { ...folder, children: [] }])
	);
	const roots: FolderNode[] = [];

	for (const node of nodes.values()) {
		const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

export function folderPath(folders: readonly FolderRow[], id: string): FolderRow[] {
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const path: FolderRow[] = [];

	let current = byId.get(id);
	while (current) {
		path.unshift(current);
		current = current.parentId === null ? undefined : byId.get(current.parentId);
	}

	return path;
}

export function folderLabel(folders: readonly FolderRow[], id: string): string {
	return folderPath(folders, id)
		.map((folder) => folder.name)
		.join(' / ');
}

// Deleting a folder removes exactly this set of rows (DB cascade) and unfiles
// the bookmarks whose folder_id is in it (FK SET NULL).
export function folderIdsWithDescendants(folders: readonly FolderRow[], id: string): Set<string> {
	const childrenByParent = new Map<string, FolderRow[]>();
	for (const folder of folders) {
		if (folder.parentId === null) continue;
		const siblings = childrenByParent.get(folder.parentId) ?? [];
		siblings.push(folder);
		childrenByParent.set(folder.parentId, siblings);
	}

	const ids = new Set<string>([id]);
	const queue = [id];
	while (queue.length > 0) {
		const current = queue.pop();
		if (current === undefined) break;
		for (const child of childrenByParent.get(current) ?? []) {
			if (!ids.has(child.id)) {
				ids.add(child.id);
				queue.push(child.id);
			}
		}
	}

	return ids;
}

export function ancestorIds(folders: readonly FolderRow[], id: string): Set<string> {
	const byId = new Map(folders.map((folder) => [folder.id, folder]));
	const ids = new Set<string>();

	let parentId = byId.get(id)?.parentId ?? null;
	while (parentId !== null) {
		ids.add(parentId);
		parentId = byId.get(parentId)?.parentId ?? null;
	}

	return ids;
}
