<script lang="ts">
	import CopyButton from './CopyButton.svelte';
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
	import { countText, type TextStats } from '$lib/toolkit/counter.js';

	let text = $state('');
	let substring = $state('');

	const stats = $derived(countText(text, substring));

	const STATS: { key: keyof TextStats; label: string }[] = [
		{ key: 'characters', label: 'Characters' },
		{ key: 'charactersNoSpaces', label: 'No spaces' },
		{ key: 'words', label: 'Words' },
		{ key: 'lines', label: 'Lines' },
		{ key: 'occurrences', label: 'Occurrences' }
	];
</script>

<Card>
	<CardHeader>
		<CardTitle>String counter</CardTitle>
		<CardDescription>Live character, word, line and substring counts.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<Label for="counter-input">Input</Label>
			<Textarea
				id="counter-input"
				bind:value={text}
				class="min-h-40 font-mono text-sm"
				placeholder="Paste or type the text to inspect…"
			/>
		</div>

		<div class="flex flex-wrap items-end gap-3">
			<div class="space-y-2">
				<Label for="counter-substring">Count occurrences of</Label>
				<Input
					id="counter-substring"
					bind:value={substring}
					class="w-48"
					placeholder="e.g. error"
				/>
			</div>
			<CopyButton value={text} label="Text copied" />
		</div>

		<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
			{#each STATS as stat (stat.key)}
				<div class="rounded-lg border border-border p-3">
					<p class="text-xs text-muted-foreground">{stat.label}</p>
					<p class="text-xl font-semibold tabular-nums">{stats[stat.key]}</p>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
