// View model the emails page and its components share. The server layer returns
// rows that structurally satisfy this shape plus the linked task title.
export const EMAIL_STATUSES = ['active', 'dead'] as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export type EmailItem = {
	id: string;
	address: string;
	provider: string | null;
	purpose: string | null;
	taskId: string | null;
	status: EmailStatus;
	notes: string | null;
	createdAt: Date;
};

// Filter patch: omitted keys keep their current value, `null` clears the filter
// (same convention as the bookmarks and tasks toolbars).
export type EmailFilterPatch = {
	q?: string;
	status?: string;
	provider?: string | null;
};

// What the editor dialog hands back on save; the page turns it into an EmailItem.
export type EmailDraft = {
	address: string;
	provider: string | null;
	purpose: string | null;
	taskId: string | null;
	status: EmailStatus;
	notes: string | null;
};
