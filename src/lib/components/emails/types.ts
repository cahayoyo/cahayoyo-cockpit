import type { EmailItem } from '$lib/emails/types';

// A row as the server returns it: the stored record plus the linked task title
// (null when unlinked, also for done tasks), so the list needs no lookup.
export type EmailRow = EmailItem & { taskTitle: string | null };

// One option of the dialog's linked-task select, rendered "title — project".
export type EmailTaskOption = { id: string; title: string; project: string };
