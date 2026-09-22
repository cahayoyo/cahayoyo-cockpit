import { randomInt } from './random';

export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?';

export type CharsetOptions = {
	lowercase: boolean;
	uppercase: boolean;
	digits: boolean;
	symbols: boolean;
};

export const DEFAULT_CHARSET: CharsetOptions = {
	lowercase: true,
	uppercase: true,
	digits: true,
	symbols: false
};

export function charsetAlphabet(options: CharsetOptions): string {
	let alphabet = '';
	if (options.lowercase) alphabet += LOWERCASE;
	if (options.uppercase) alphabet += UPPERCASE;
	if (options.digits) alphabet += DIGITS;
	if (options.symbols) alphabet += SYMBOLS;
	return alphabet;
}

// Draws from a ready alphabet — shared by generateString and callers that
// filter a charset first (the vault password generator).
export function generateFromAlphabet(length: number, alphabet: string): string {
	if (alphabet === '') return '';

	const size = Math.min(Math.max(Math.trunc(Number(length)) || 1, 1), 256);
	let output = '';
	for (let index = 0; index < size; index += 1) {
		output += alphabet[randomInt(alphabet.length)];
	}
	return output;
}

export function generateString(length: number, options: CharsetOptions): string {
	return generateFromAlphabet(length, charsetAlphabet(options));
}

const ALPHANUMERIC = LOWERCASE + UPPERCASE + DIGITS;

// Pattern tokens (decision 9): A = uppercase, a = lowercase, # = digit,
// ? = alphanumeric; every other character is a literal.
export function generatePattern(pattern: string): string {
	let output = '';
	for (const token of pattern) {
		output += expandToken(token);
	}
	return output;
}

function expandToken(token: string): string {
	switch (token) {
		case 'A':
			return UPPERCASE[randomInt(UPPERCASE.length)];
		case 'a':
			return LOWERCASE[randomInt(LOWERCASE.length)];
		case '#':
			return DIGITS[randomInt(DIGITS.length)];
		case '?':
			return ALPHANUMERIC[randomInt(ALPHANUMERIC.length)];
		default:
			return token;
	}
}
