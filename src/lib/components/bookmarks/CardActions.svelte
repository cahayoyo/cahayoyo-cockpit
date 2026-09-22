<script lang="ts">
	// Shared card atoms (star + copy link + kebab) — both views keep their own layout.
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Star from '@lucide/svelte/icons/star';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import type { BookmarkItem } from './types.js';

	let {
		bookmark,
		overlay = false,
		onedit,
		ondelete
	}: {
		bookmark: BookmarkItem;
		overlay?: boolean;
		onedit: (bookmark: BookmarkItem) => void;
		ondelete: (bookmark: BookmarkItem) => void;
	} = $props();

	const surface = $derived(overlay ? 'bg-background/90 shadow-sm' : '');

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copyLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(bookmark.url);
		} catch {
			toast.error('Could not copy the link.');
			return;
		}

		copied = true;
		toast.success('Link copied');
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<div class={cn('relative z-10 flex items-center gap-1', overlay && 'rounded-full')}>
	<form method="post" action="?/toggleFavorite" use:enhance>
		<input type="hidden" name="id" value={bookmark.id} />
		<input type="hidden" name="favorite" value={bookmark.favorite ? 'false' : 'true'} />
		<Button
			type="submit"
			variant="ghost"
			size="icon-lg"
			class={cn('md:size-7', surface)}
			aria-label={bookmark.favorite ? 'Remove from favorites' : 'Add to favorites'}
			aria-pressed={bookmark.favorite}
		>
			<Star class={cn('size-4', bookmark.favorite && 'fill-primary text-primary')} />
		</Button>
	</form>

	<Button
		variant="ghost"
		size="icon-lg"
		class={cn('md:size-7', 'hidden lg:inline-flex', surface)}
		aria-label={copied ? 'Link copied' : 'Copy link'}
		title="Copy link"
		onclick={copyLink}
	>
		{#if copied}
			<Check class="size-4 text-primary" />
		{:else}
			<Copy class="size-4" />
		{/if}
	</Button>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon-lg"
					class={cn('md:size-7', surface)}
					aria-label="Bookmark actions"
					{...props}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item class="gap-2 lg:hidden" onSelect={copyLink}>
				<Copy class="size-4" />
				Copy link
			</DropdownMenu.Item>
			<DropdownMenu.Item class="gap-2" onSelect={() => onedit(bookmark)}>
				<Pencil class="size-4" />
				Edit
			</DropdownMenu.Item>
			<DropdownMenu.Item class="gap-2" variant="destructive" onSelect={() => ondelete(bookmark)}>
				<Trash2 class="size-4" />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
