export type NoteItem = {
	id: string;
	title: string;
	body: string;
	folderId: string | null;
	pinned: boolean;
	updatedAt: Date;
	snippet: string;
};
