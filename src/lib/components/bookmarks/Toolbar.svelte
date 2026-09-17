<script lang="ts">
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import List from '@lucide/svelte/icons/list';
	import Plus from '@lucide/svelte/icons/plus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Search from '@lucide/svelte/icons/search';
	import Star from '@lucide/svelte/icons/star';
	import { onDestroy } from 'svelte';
	import type { BookmarkView } from '$lib/bookmarks/params.js';
	import type { SortKey } from '$lib/bookmarks/filters.js';
	import { ROOT_FOLDER_ID } from '$lib/folders/tree.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { cn } from '$lib/utils.js';
	import type { FilterPatch } from './types.js';

	const VIEWS = [
		{ key: 'grid', label: 'Grid view', icon: LayoutGrid },
		{ key: 'list', label: 'List view', icon: List }
	] as const;

	let {
		q,
		favorite,
		tag,
		sort,
		view,
		folder,
		tags,
		count,
		onfilter,
		onview,
		onreset,
		onnew
	}: {
		q: string;
		favorite: boolean;
		tag: string | null;
		sort: SortKey;
		view: BookmarkView;
		folder: string;
		tags: string[];
		count: number;
		onfilter: (patch: FilterPatch) => void;
		onview: (view: BookmarkView) => void;
		onreset: () => void;
		onnew: () => void;
	} = $props();

	// Typing is applied to the URL after a short pause so the page does not reload
	// on every keystroke. The URL stays the source of truth when it changes another way.
	let draft = $state('');
	let emitted = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (q === emitted) return;
		// The URL changed from somewhere else (reset, back button, another control):
		// drop any pending keystroke so it cannot overwrite that change.
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

	const filtersActive = $derived(
		q.trim().length > 0 ||
			favorite ||
			tag !== null ||
			sort !== 'newest' ||
			folder !== ROOT_FOLDER_ID
	);
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
				placeholder="Search title or URL"
				class="pl-8"
				aria-label="Search bookmarks"
			/>
		</div>

		<div class="grid w-full grid-cols-2 gap-2 sm:contents">
			<Button
				variant={favorite ? 'secondary' : 'outline'}
				aria-pressed={favorite}
				class="w-full max-sm:h-11 sm:w-auto"
				onclick={() => onfilter({ favorite: !favorite })}
			>
				<Star class={cn(favorite && 'fill-primary text-primary')} />
				Favorites
			</Button>

			<Select.Root
				type="single"
				value={tag ?? 'all'}
				onValueChange={(value) => onfilter({ tag: value === 'all' ? null : value })}
			>
				<Select.Trigger class="w-full sm:w-auto" aria-label="Filter by tag"
					>{tag ?? 'All tags'}</Select.Trigger
				>
				<Select.Content>
					<Select.Item value="all" label="All tags">All tags</Select.Item>
					{#each tags as option (option)}
						<Select.Item value={option} label={option}>{option}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			<Select.Root
				type="single"
				value={sort}
				onValueChange={(value) => {
					if (value === 'newest' || value === 'title') onfilter({ sort: value });
				}}
			>
				<Select.Trigger class="w-full sm:w-auto" aria-label="Sort bookmarks"
					>{sort === 'title' ? 'Title A–Z' : 'Newest first'}</Select.Trigger
				>
				<Select.Content>
					<Select.Item value="newest" label="Newest first">Newest first</Select.Item>
					<Select.Item value="title" label="Title A–Z">Title A–Z</Select.Item>
				</Select.Content>
			</Select.Root>

			<Button
				variant="ghost"
				disabled={!filtersActive}
				class="w-full max-sm:h-11 sm:w-auto"
				onclick={onreset}
			>
				<RotateCcw class="size-4" />
				Reset
			</Button>
		</div>

		<div class="hidden flex-1 sm:block"></div>

		<div class="flex w-full items-center gap-2 sm:contents">
			<div
				class="flex shrink-0 items-center gap-0.5 rounded-lg border border-border p-0.5"
				role="group"
				aria-label="View"
			>
				{#each VIEWS as option (option.key)}
					<Button
						variant={view === option.key ? 'secondary' : 'ghost'}
						size="icon-lg"
						class="max-sm:size-11 md:size-7"
						aria-label={option.label}
						title={option.label}
						aria-pressed={view === option.key}
						onclick={() => onview(option.key)}
					>
						<option.icon class="size-4" />
					</Button>
				{/each}
			</div>

			<Button class="flex-1 max-sm:h-11 sm:flex-none" onclick={onnew}>
				<Plus />
				New bookmark
			</Button>
		</div>
	</div>

	<p class="text-xs text-muted-foreground tabular-nums">
		{count}
		{count === 1 ? 'bookmark' : 'bookmarks'}
	</p>
</div>
