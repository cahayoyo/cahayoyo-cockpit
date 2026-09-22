export type TextStats = {
	characters: number;
	charactersNoSpaces: number;
	words: number;
	lines: number;
	occurrences: number;
};

export function countText(text: string, substring = ''): TextStats {
	const trimmed = text.trim();
	return {
		characters: text.length,
		charactersNoSpaces: text.replace(/\s/g, '').length,
		words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
		lines: text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
		occurrences: substring === '' ? 0 : text.split(substring).length - 1
	};
}
