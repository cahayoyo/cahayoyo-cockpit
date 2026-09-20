<script lang="ts">
	// Emails toolbar: search, status + provider filters, reset and the New email
	// action. The URL is the source of truth — every control reports a patch.
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Search from '@lucide/svelte/icons/search';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { EmailStatusFilter } from '$lib/emails/filters.js';
	import { EMAIL_STATUS_META, EMAIL_STATUS_ORDER } from '$lib/emails/presentation.js';
	import type { EmailFilterPatch } from '$lib/emails/types.js';

	let {
		q,
		status,
		provider,
		providers,
		count,
		onfilter,
		onnew
	}: {
		q: string;
		status: EmailStatusFilter;
		provider: string | null;
		providers: string[];
		count: number;
		onfilter: (patch: EmailFilterPatch) => void;
		onnew: () => void;
	} = $props();

	// Typing is applied after a short pause (same pattern as the bookmarks toolbar).
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

	const filtersActive = $derived(q.trim().length > 0 || status !== 'active' || provider !== null);
	const statusLabel = $derived(status === 'all' ? 'All statuses' : EMAIL_STATUS_META[status].label);
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
				placeholder="Search address, purpose, notes"
				class="pl-8"
				aria-label="Search disposable emails"
			/>
		</div>

		<div class="grid w-full grid-cols-2 gap-2 sm:contents">
			<Select.Root
				type="single"
				value={status}
				onValueChange={(value) => onfilter({ status: value })}
			>
				<Select.Trigger class="w-full sm:w-auto" aria-label="Filter by status">
					{statusLabel}
				</Select.Trigger>
				<Select.Content>
					{#each EMAIL_STATUS_ORDER as option (option)}
						<Select.Item value={option} label={EMAIL_STATUS_META[option].label}>
							{EMAIL_STATUS_META[option].label}
						</Select.Item>
					{/each}
					<Select.Item value="all" label="All statuses">All statuses</Select.Item>
				</Select.Content>
			</Select.Root>

			<Select.Root
				type="single"
				value={provider ?? 'all'}
				onValueChange={(value) => onfilter({ provider: value === 'all' ? null : value })}
			>
				<Select.Trigger class="w-full sm:w-auto" aria-label="Filter by provider">
					{provider ?? 'All providers'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All providers">All providers</Select.Item>
					{#each providers as option (option)}
						<Select.Item value={option} label={option}>{option}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Button
				variant="ghost"
				disabled={!filtersActive}
				class="w-full max-sm:h-11 sm:w-auto"
				onclick={() => onfilter({ q: '', status: 'active', provider: null })}
			>
				<RotateCcw class="size-4" />
				Reset
			</Button>
		</div>

		<div class="hidden flex-1 sm:block"></div>

		<Button class="w-full max-sm:h-11 sm:w-auto" onclick={onnew}>
			<Plus />
			New email
		</Button>
	</div>

	<p class="text-xs text-muted-foreground tabular-nums">
		{count}
		{count === 1 ? 'email' : 'emails'}
	</p>
</div>
