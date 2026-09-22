<script lang="ts">
	// Preview tile shared by the grid and list views: the image, or a letter fallback.
	import { fallbackLetter } from '$lib/bookmarks/format.js';
	import { cn } from '$lib/utils.js';

	let {
		title,
		imageId,
		tileClass,
		letterClass
	}: {
		title: string;
		imageId: string | null;
		tileClass: string;
		letterClass: string;
	} = $props();
</script>

{#if imageId}
	<img src="/media/{imageId}" alt="" class={tileClass} loading="lazy" />
{:else}
	<div class={cn('grid place-items-center bg-muted', tileClass)}>
		<span class={cn('font-semibold text-muted-foreground', letterClass)}>
			{fallbackLetter(title)}
		</span>
	</div>
{/if}
