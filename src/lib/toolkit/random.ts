export function randomInt(maxExclusive: number): number {
	if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) return 0;
	const buffer = new Uint32Array(1);
	crypto.getRandomValues(buffer);
	return buffer[0] % Math.floor(maxExclusive);
}

export function pick<T>(items: readonly T[]): T {
	return items[randomInt(items.length)];
}
