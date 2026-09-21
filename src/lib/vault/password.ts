import { randomInt } from '$lib/toolkit/random';
import {
	charsetAlphabet,
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

const MIN_LENGTH = 1;
const MAX_LENGTH = 256;

function clampLength(length: number): number {
	return Math.min(Math.max(Math.trunc(Number(length)) || MIN_LENGTH, MIN_LENGTH), MAX_LENGTH);
}

export function generatePassword(length: number, excludeAmbiguous: boolean): string {
	const size = clampLength(length);

	if (!excludeAmbiguous) {
		return generateString(size, PASSWORD_CHARSET);
	}

	const alphabet = [...charsetAlphabet(PASSWORD_CHARSET)]
		.filter((char) => !AMBIGUOUS_CHARS.includes(char))
		.join('');

	let output = '';
	for (let index = 0; index < size; index += 1) {
		output += alphabet[randomInt(alphabet.length)];
	}

	return output;
}
