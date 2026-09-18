export type JsonError = {
	ok: false;
	message: string;
	line: number | null;
	column: number | null;
};

export type JsonParseResult = { ok: true; value: unknown } | JsonError;

export type JsonOutputResult = { ok: true; output: string } | JsonError;

export function parseJson(input: string): JsonParseResult {
	const trimmed = input.trim();
	if (trimmed === '') return { ok: false, message: 'Input is empty.', line: null, column: null };

	try {
		return { ok: true, value: JSON.parse(trimmed) };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid JSON.';
		return { ok: false, message, ...locate(trimmed) };
	}
}

export function formatJson(input: string, indent = 2): JsonOutputResult {
	const result = parseJson(input);
	if (!result.ok) return result;
	return { ok: true, output: JSON.stringify(result.value, null, indent) ?? '' };
}

export function minifyJson(input: string): JsonOutputResult {
	const result = parseJson(input);
	if (!result.ok) return result;
	return { ok: true, output: JSON.stringify(result.value) ?? '' };
}

// Modern V8 and JavaScriptCore messages carry no position, so the first syntax
// error is relocated with a scanner and turned into a 1-based line/column.
function locate(input: string): { line: number | null; column: number | null } {
	let position: number | null;
	try {
		position = findFirstError(input);
	} catch {
		// Deeply nested input can overflow the scan recursion; fall back to the message alone.
		return { line: null, column: null };
	}
	if (position === null) return { line: null, column: null };

	const before = input.slice(0, position);
	return {
		line: before.split('\n').length,
		column: position - before.lastIndexOf('\n')
	};
}

const NUMBER_LITERAL = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

function findFirstError(input: string): number | null {
	let position = 0;
	let errorAt: number | null = null;

	const fail = (at: number): false => {
		if (errorAt === null) errorAt = at;
		return false;
	};

	const skipWhitespace = (): void => {
		while (position < input.length && ' \t\n\r'.includes(input[position])) position += 1;
	};

	const parseString = (): boolean => {
		position += 1;
		while (position < input.length) {
			const character = input[position];
			if (character === '"') {
				position += 1;
				return true;
			}
			if (character === '\\') {
				position += 1;
				if (position >= input.length) return fail(position);
				const escape = input[position];
				if (!'"\\/bfnrtu'.includes(escape)) return fail(position);
				if (escape === 'u') {
					if (!/^[0-9a-fA-F]{4}$/.test(input.slice(position + 1, position + 5)))
						return fail(position);
					position += 5;
				} else {
					position += 1;
				}
				continue;
			}
			if (character.charCodeAt(0) < 0x20) return fail(position);
			position += 1;
		}
		return fail(position);
	};

	const parseNumber = (): boolean => {
		NUMBER_LITERAL.lastIndex = position;
		if (!NUMBER_LITERAL.test(input)) return fail(position);
		position = NUMBER_LITERAL.lastIndex;
		return true;
	};

	const parseObject = (): boolean => {
		position += 1;
		skipWhitespace();
		if (input[position] === '}') {
			position += 1;
			return true;
		}
		while (true) {
			skipWhitespace();
			if (input[position] !== '"') return fail(position);
			if (!parseString()) return false;
			skipWhitespace();
			if (input[position] !== ':') return fail(position);
			position += 1;
			if (!parseValue()) return false;
			skipWhitespace();
			if (input[position] === ',') {
				position += 1;
				continue;
			}
			if (input[position] === '}') {
				position += 1;
				return true;
			}
			return fail(position);
		}
	};

	const parseArray = (): boolean => {
		position += 1;
		skipWhitespace();
		if (input[position] === ']') {
			position += 1;
			return true;
		}
		while (true) {
			if (!parseValue()) return false;
			skipWhitespace();
			if (input[position] === ',') {
				position += 1;
				continue;
			}
			if (input[position] === ']') {
				position += 1;
				return true;
			}
			return fail(position);
		}
	};

	const parseValue = (): boolean => {
		skipWhitespace();
		if (position >= input.length) return fail(position);
		const character = input[position];
		if (character === '{') return parseObject();
		if (character === '[') return parseArray();
		if (character === '"') return parseString();
		if (character === '-' || (character >= '0' && character <= '9')) return parseNumber();
		for (const literal of ['true', 'false', 'null']) {
			if (input.startsWith(literal, position)) {
				position += literal.length;
				return true;
			}
		}
		return fail(position);
	};

	if (!parseValue()) return errorAt;
	skipWhitespace();
	return position === input.length ? null : position;
}
