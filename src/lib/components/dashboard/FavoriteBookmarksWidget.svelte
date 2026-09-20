<script lang="ts">
	// Dashboard widget: up to 6 favorite bookmarks as mini cards (thumbnail +
	// title) linking straight to the URL; the selection happens in
	// $lib/dashboard/select.
	import Star from '@lucide/svelte/icons/star';
	import { resolve } from '$app/paths';
	import BookmarkThumbnail from '$lib/components/bookmarks/BookmarkThumbnail.svelte';
	import type { BookmarkItem } from '$lib/components/bookmarks/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import WidgetCard from './WidgetCard.svelte';

	let { bookmarks }: { bookmarks: BookmarkItem[] } = $props();
</script>

<WidgetCard title="Favorite bookmarks" href="/bookmarks?favorite=true">
	{#if bookmarks.length === 0}
		<div class="flex flex-col items-center gap-3 py-4 text-center">
			<Star class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No favorite bookmarks.</p>
			<Button variant="outline" size="sm" class="max-sm:h-11" href={resolve('/bookmarks')}>
				Browse bookmarks
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
			{#each bookmarks as bookmark (bookmark.id)}
				<a
					href={bookmark.url}
					target="_blank"
					rel="external noreferrer"
					class="flex min-w-0 items-center gap-2 rounded-lg border border-border p-2 transition-colors hover:bg-muted"
					title={bookmark.title}
				>
					<BookmarkThumbnail
						title={bookmark.title}
						imageId={bookmark.imageId}
						tileClass="size-8 shrink-0 rounded-md object-cover"
						letterClass="text-sm"
					/>
					<span class="min-w-0 truncate text-sm">{bookmark.title}</span>
				</a>
			{/each}
		</div>
	{/if}
</WidgetCard>
