<script lang="ts">
	// Vault toolbar: search, type filter, rows/table view toggle, reset and the
	// New entry action. The URL is the source of truth — every control reports a
	// patch (emails pattern).
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Search from '@lucide/svelte/icons/search';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils.js';
	import { VAULT_TYPE_FILTERS, type VaultTypeFilter } from '$lib/vault/params.js';
	import { VAULT_TYPE_META } from '$lib/vault/presentation.js';
	import type { VaultFilterPatch, VaultView } from '$lib/vault/types.js';

	const VIEWS: { key: VaultView; label: string }[] = [
		{ key: 'rows', label: 'Rows' },
		{ key: 'table', label: 'Table' }
	];

	let {
		q,
		type,
		view,
		count,
		onfilter,
		onview,
		onnew
	}: {
		q: string;
		type: VaultTypeFilter;
		view: VaultView;
		count: number;
		onfilter: (patch: VaultFilterPatch) => void;
		onview: (view: VaultView) => void;
		onnew: () => void;
	} = $props();

	// Typing is applied after a short pause (same pattern as the emails toolbar).
	let draft = $state('');
	let emitted = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (q === emitted) return;
		clearTimeout(timer);
		draft = q;
		emitted = q;
	});

	function onSearch(): void {
		clearTimeout(timer);
		timer = setTimeout(() => {
			emitted = draft;
			onfilter({ q: draft });
		}, 250);
	}

	onDestroy(() => clearTimeout(timer));

	const filtersActive = $derived(q.trim().length > 0 || type !== 'all');
	const typeLabel = $derived(type === 'all' ? 'All types' : VAULT_TYPE_META[type].label);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<div class="relative w-full sm:w-64">
			<Search
				class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				bind:value={draft}
				oninput={onSearch}
				placeholder="Search title, tags"
				class="pl-8 max-sm:h-11"
				aria-label="Search vault entries"
			/>
		</div>

		<div class="grid w-full grid-cols-2 gap-2 sm:contents">
			<Select.Root type="single" value={type} onValueChange={(value) => onfilter({ type: value })}>
				<Select.Trigger class="w-full max-sm:h-11! sm:w-auto" aria-label="Filter by type">
					{typeLabel}
				</Select.Trigger>
				<Select.Content>
					{#each VAULT_TYPE_FILTERS as option (option)}
						<Select.Item
							value={option}
							label={option === 'all' ? 'All types' : VAULT_TYPE_META[option].label}
						>
							{option === 'all' ? 'All types' : VAULT_TYPE_META[option].label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Button
				variant="ghost"
				disabled={!filtersActive}
				class="w-full max-sm:h-11 sm:w-auto"
				onclick={() => onfilter({ q: '', type: 'all' })}
			>
				<RotateCcw class="size-4" />
				Reset
			</Button>
		</div>

		<div class="hidden flex-1 sm:block"></div>

		<div
			class="flex gap-0.5 rounded-lg border border-border p-0.5"
			role="group"
			aria-label="List view"
		>
			{#each VIEWS as option (option.key)}
				<button
					type="button"
					class={cn(
						'rounded-md px-2 py-0.5 text-xs font-medium transition-colors max-lg:min-h-11 max-lg:px-3',
						view === option.key
							? 'bg-accent text-foreground'
							: 'text-muted-foreground hover:bg-accent/50'
					)}
					aria-pressed={view === option.key}
					onclick={() => onview(option.key)}
				>
					{option.label}
				</button>
			{/each}
		</div>

		<Button class="w-full max-sm:h-11 sm:w-auto" onclick={onnew}>
			<Plus />
			New entry
		</Button>
	</div>

	<p class="text-xs text-muted-foreground tabular-nums">
		{count}
		{count === 1 ? 'entry' : 'entries'}
	</p>
</div>
