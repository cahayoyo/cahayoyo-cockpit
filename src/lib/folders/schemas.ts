import { z } from 'zod';

export const folderFormSchema = z.object({
	name: z.string().trim().min(1, 'Name is required.').max(100, 'Name is too long.'),
	parentId: z.uuid().nullable()
});

export type FolderFormInput = z.infer<typeof folderFormSchema>;
