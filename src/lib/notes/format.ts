function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** List-row timestamp in local time: `YYYY-MM-DD HH:mm` (locked decision). */
export function formatDateTime(value: Date): string {
	return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${formatTime(value)}`;
}

/** Save indicator clock in local time: `HH:mm`. */
export function formatTime(value: Date): string {
	return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
