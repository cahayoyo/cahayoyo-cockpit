type SortableNote = {
	pinned: boolean;
	updatedAt: Date;
};

const SNIPPET_LENGTH = 80;

// List order: pinned notes first, then most recently updated.
export function sortNotes<T extends SortableNote>(notes: readonly T[]): T[] {
	return [...notes].sort(
		(a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.getTime() - a.updatedAt.getTime()
	);
}

// One-line plain-text preview for the note list: markdown syntax is dropped
// (snake_case and hyphenated words survive), the body collapses to a single
// line, and long text is truncated.
export function noteSnippet(body: string): string {
	const plain = body
		.replace(/^\s*```.*$/gm, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/~~([^~]+)~~/g, '$1')
		.replace(/`([^`]*)`/g, '$1')
		.replace(/^\s{0,3}#{1,6}\s+/gm, '')
		.replace(/^\s{0,3}>\s?/gm, '')
		.replace(/^\s{0,3}(?:[-*+]|\d+[.)])\s+/gm, '')
		.replace(/\s+/g, ' ')
		.trim();

	return plain.length > SNIPPET_LENGTH ? `${plain.slice(0, SNIPPET_LENGTH).trimEnd()}…` : plain;
}

// LIKE metacharacters in a search term are escaped so a query like "100%"
// matches the literal text; Postgres uses backslash as the default escape.
export function likePattern(term: string): string {
	return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}
