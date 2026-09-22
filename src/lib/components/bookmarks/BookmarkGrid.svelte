<script lang="ts">
	// View mode: Grid — dense 4-column grid, square thumbnails, tags as plain text.
	import BookmarkThumbnail from './BookmarkThumbnail.svelte';
	import CardActions from './CardActions.svelte';
	import type { ViewProps } from './types.js';

	let { items, onedit, ondelete }: ViewProps = $props();
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
	{#each items as bookmark (bookmark.id)}
		<article
			class="relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
		>
			<div class="relative">
				<BookmarkThumbnail
					title={bookmark.title}
					imageId={bookmark.imageId}
					tileClass="aspect-square w-full object-cover"
					letterClass="text-3xl"
				/>

				<div class="absolute top-1.5 right-1.5">
					<CardActions {bookmark} overlay {onedit} {ondelete} />
				</div>
			</div>

			<div class="flex flex-1 flex-col gap-1 p-2.5">
				<a
					href={bookmark.url}
					target="_blank"
					rel="external noreferrer"
					class="text-sm font-medium after:absolute after:inset-0"
				>
					{bookmark.title}
				</a>
				<p class="truncate text-xs text-muted-foreground">{bookmark.tags.join(' · ')}</p>
			</div>
		</article>
	{/each}
</div>
