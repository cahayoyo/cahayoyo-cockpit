import type { EmailItem } from '$lib/emails/types';

// A row as the server returns it: the stored record plus the linked task's title
// (null only when unlinked — the server join has no task-status filter).
export type EmailRow = EmailItem & { taskTitle: string | null };

// One option of the dialog's linked-task select, rendered "title — project".
export type EmailTaskOption = { id: string; title: string; project: string };
