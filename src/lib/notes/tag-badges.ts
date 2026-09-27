// Deterministic tag colors: a stable hash of the tag name picks one tinted
// token pair, so a tag keeps its color across surfaces and sessions. Same
// tinted-badge shape as the task status badges ($lib/tasks/presentation).
const TAG_BADGE_CLASSES = [
	'border-info/30 bg-info/10 text-info',
	'border-violet/30 bg-violet/10 text-violet',
	'border-teal/30 bg-teal/10 text-teal',
	'border-success/30 bg-success/10 text-success',
	'border-warning/30 bg-warning/10 text-warning'
] as const;

export function tagBadgeClass(name: string): string {
	let hash = 0;
	for (let index = 0; index < name.length; index += 1) {
		hash = (hash * 31 + name.charCodeAt(index)) | 0;
	}
	return TAG_BADGE_CLASSES[Math.abs(hash) % TAG_BADGE_CLASSES.length];
}
