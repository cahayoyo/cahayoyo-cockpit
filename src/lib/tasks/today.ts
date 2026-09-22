// "Today" is computed in the app timezone (Asia/Jakarta), never the server
// container's timezone (grill decision Q8) — due dates must not shift by a day.
const APP_TIME_ZONE = 'Asia/Jakarta';

const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE });

/** Formats an instant as the app-zone calendar date (`YYYY-MM-DD`). */
export function dateInAppZone(instant: Date): string {
	return dateFormat.format(instant);
}

export function todayIso(): string {
	return dateInAppZone(new Date());
}

/** Date-only arithmetic on a `YYYY-MM-DD` calendar date. */
export function addDaysIso(iso: string, days: number): string {
	const date = new Date(`${iso}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}
