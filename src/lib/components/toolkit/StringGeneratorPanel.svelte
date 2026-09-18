<script lang="ts">
	import { onMount } from 'svelte';
	import CopyButton from './CopyButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import {
		charsetAlphabet,
		DEFAULT_CHARSET,
		generatePattern,
		generateString,
		type CharsetOptions
	} from '$lib/toolkit/string-generator.js';

	type Mode = 'charset' | 'pattern';

	const MODES: { key: Mode; name: string }[] = [
		{ key: 'charset', name: 'Charset' },
		{ key: 'pattern', name: 'Pattern' }
	];

	const CHARSETS: { key: keyof CharsetOptions; label: string }[] = [
		{ key: 'lowercase', label: 'Lowercase (a-z)' },
		{ key: 'uppercase', label: 'Uppercase (A-Z)' },
		{ key: 'digits', label: 'Digits (0-9)' },
		{ key: 'symbols', label: 'Symbols' }
	];

	let mode = $state<Mode>('charset');
	let length = $state(16);
	let options = $state<CharsetOptions>({ ...DEFAULT_CHARSET });
	let pattern = $state('');
	let output = $state('');

	const alphabet = $derived(charsetAlphabet(options));
	const invalid = $derived(mode === 'charset' ? alphabet === '' : pattern.trim() === '');

	function generate(): void {
		if (mode === 'charset') {
			output = alphabet === '' ? '' : generateString(length, options);
			return;
		}
		output = pattern.trim() === '' ? '' : generatePattern(pattern);
	}

	function pick(next: Mode): void {
		mode = next;
		generate();
	}

	onMount(generate);
</script>

<Card>
	<CardHeader>
		<CardTitle>String generator</CardTitle>
		<CardDescription>
			Generate a random string from a character set, or render a template pattern.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div
			class="flex gap-0.5 rounded-lg border border-border p-0.5"
			role="group"
			aria-label="Generator mode"
		>
			{#each MODES as option (option.key)}
				<button
					type="button"
					class={cn(
						'rounded-md px-2 py-0.5 text-xs font-medium transition-colors max-lg:min-h-11 max-lg:px-3',
						mode === option.key
							? 'bg-accent text-foreground'
							: 'text-muted-foreground hover:bg-accent/50'
					)}
					aria-pressed={mode === option.key}
					onclick={() => pick(option.key)}
				>
					{option.name}
				</button>
			{/each}
		</div>

		{#if mode === 'charset'}
			<div class="flex flex-wrap items-end gap-6">
				<div class="space-y-2">
					<Label for="string-length">Length</Label>
					<Input
						id="string-length"
						type="number"
						min="1"
						max="256"
						bind:value={length}
						class="w-28"
					/>
				</div>

				<fieldset class="flex flex-wrap gap-x-6 gap-y-2">
					<legend class="mb-2 text-sm font-medium">Character sets</legend>
					{#each CHARSETS as charset (charset.key)}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								class="size-4 accent-primary"
								bind:checked={options[charset.key]}
							/>
							{charset.label}
						</label>
					{/each}
				</fieldset>
			</div>
		{:else}
			<div class="space-y-2">
				<Label for="string-pattern">Pattern</Label>
				<Input
					id="string-pattern"
					bind:value={pattern}
					class="font-mono sm:max-w-sm"
					placeholder="e.g. INV-####-A?a"
				/>
				<p class="text-xs text-muted-foreground">
					A uppercase · a lowercase · # digit · ? alphanumeric — other characters pass through.
				</p>
			</div>
		{/if}

		{#if mode === 'charset' && alphabet === ''}
			<p class="text-sm text-destructive">Select at least one character set.</p>
		{:else if mode === 'pattern' && pattern.trim() === ''}
			<p class="text-sm text-destructive">Enter a pattern to generate from.</p>
		{/if}

		<div class="flex flex-wrap items-center gap-2">
			<Button variant="secondary" onclick={generate} disabled={invalid}>Generate</Button>
			<CopyButton value={output} label="String copied" />
		</div>

		<Textarea
			readonly
			value={output}
			class="min-h-20 font-mono text-sm"
			aria-label="Generated string"
		/>
	</CardContent>
</Card>
