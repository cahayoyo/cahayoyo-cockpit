<script lang="ts">
	// View mode: List — one bookmark per row, maximum density.
	import { hostname } from '$lib/bookmarks/format.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import BookmarkThumbnail from './BookmarkThumbnail.svelte';
	import CardActions from './CardActions.svelte';
	import type { ViewProps } from './types.js';

	let { items, onedit, ondelete }: ViewProps = $props();
</script>

<div
	class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
>
	{#each items as bookmark (bookmark.id)}
		<div class="relative flex items-center gap-3 p-2.5">
			<BookmarkThumbnail
				title={bookmark.title}
				imageId={bookmark.imageId}
				tileClass="size-14 shrink-0 rounded-lg object-cover"
				letterClass="text-lg"
			/>

			<div class="min-w-0 flex-1">
				<a
					href={bookmark.url}
					target="_blank"
					rel="external noreferrer"
					class="font-medium after:absolute after:inset-0"
				>
					{bookmark.title}
				</a>
				<p class="truncate text-xs text-muted-foreground">
					{hostname(bookmark.url)}{bookmark.description ? ` — ${bookmark.description}` : ''}
				</p>
			</div>

			<div class="hidden shrink-0 flex-wrap justify-end gap-1 lg:flex">
				{#each bookmark.tags as tag (tag)}
					<Badge variant="secondary">{tag}</Badge>
				{/each}
			</div>

			<CardActions {bookmark} {onedit} {ondelete} />
		</div>
	{/each}
</div>
