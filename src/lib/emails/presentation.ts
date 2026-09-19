import type { EmailStatus } from './types';
import { EMAIL_STATUSES } from './types';

// Client-safe display metadata for the email status enum, same shape as the
// task STATUS_META. Tinted tokens always ship with a text label.
export const EMAIL_STATUS_META: Record<EmailStatus, { label: string; badge: string }> = {
	active: { label: 'Active', badge: 'border-success/30 bg-success/10 text-success' },
	dead: { label: 'Dead', badge: 'border-muted-foreground/30 bg-muted text-muted-foreground' }
};

export const EMAIL_STATUS_ORDER: readonly EmailStatus[] = EMAIL_STATUSES;

/** Static provider suggestions for the editor datalist (grill decision 3). */
export const PROVIDER_SUGGESTIONS = [
	'mail.tm',
	'temp-mail',
	'mailinator',
	'yopmail',
	'guerrillamail'
] as const;
