export function parseTags(input: string): string[] {
	const tags = input
		.split(',')
		.map((tag) => tag.trim().toLowerCase())
		.filter((tag) => tag.length > 0);

	return [...new Set(tags)];
}

// Groups link rows (`{ id, name }`, id = the owning bookmark/note) into tag
// names per owner, in the order the query returned them.
export function groupTagNames(
	links: readonly { id: string; name: string }[]
): Map<string, string[]> {
	const byId = new Map<string, string[]>();

	for (const link of links) {
		const names = byId.get(link.id) ?? [];
		names.push(link.name);
		byId.set(link.id, names);
	}

	return byId;
}
