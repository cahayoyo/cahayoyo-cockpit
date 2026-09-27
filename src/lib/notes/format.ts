import { addDaysIso, APP_TIME_ZONE, dateInAppZone } from '$lib/tasks/today';

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** Save indicator clock in local time: `HH:mm`. */
export function formatTime(value: Date): string {
	return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
	timeZone: APP_TIME_ZONE,
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

const dateFormat = new Intl.DateTimeFormat('en-US', {
	timeZone: APP_TIME_ZONE,
	month: 'short',
	day: 'numeric',
	year: 'numeric'
});

// List-row timestamp in the app timezone (same rule as dateInAppZone):
// `Today, 11:24` / `Yesterday, 16:32` / `Sep 20, 2025`. `now` is injectable so
// the label stays pure and testable.
export function formatRelativeTime(value: Date, now: Date = new Date()): string {
	const today = dateInAppZone(now);
	const valueDate = dateInAppZone(value);

	if (valueDate === today) {
		return `Today, ${timeFormat.format(value)}`;
	}
	if (valueDate === addDaysIso(today, -1)) {
		return `Yesterday, ${timeFormat.format(value)}`;
	}
	return dateFormat.format(value);
}
