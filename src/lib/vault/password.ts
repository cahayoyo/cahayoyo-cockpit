import {
	charsetAlphabet,
	generateFromAlphabet,
	generateString,
	type CharsetOptions
} from '$lib/toolkit/string-generator';

// Password generator settings (grill decision 8): all four character sets,
// symbols included; the popover only exposes length and exclude-ambiguous.
export const PASSWORD_CHARSET: CharsetOptions = {
	lowercase: true,
	uppercase: true,
	digits: true,
	symbols: true
};

// Characters that are easy to confuse when transcribing a generated password.
export const AMBIGUOUS_CHARS = 'Il1O0';

export function generatePassword(length: number, excludeAmbiguous: boolean): string {
	if (!excludeAmbiguous) {
		return generateString(length, PASSWORD_CHARSET);
	}

	const alphabet = [...charsetAlphabet(PASSWORD_CHARSET)]
		.filter((char) => !AMBIGUOUS_CHARS.includes(char))
		.join('');

	return generateFromAlphabet(length, alphabet);
}
