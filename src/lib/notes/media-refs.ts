// Notes reference shared Image Assets by the literal path `/media/<id>` in their
// Markdown body. There is no FK, so media usage/deletion scans note bodies with
// this helper (one count per note, not per occurrence).
const MEDIA_REFERENCE = /\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function extractMediaIds(markdown: string): string[] {
	const ids = new Set<string>();
	for (const match of markdown.matchAll(MEDIA_REFERENCE)) {
		ids.add(match[1].toLowerCase());
	}

	return [...ids];
}
