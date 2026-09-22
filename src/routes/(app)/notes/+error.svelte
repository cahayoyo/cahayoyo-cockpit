<script lang="ts">
	// Error state for the notes page: message + retry (DESIGN.md > Empty / Loading / Error states).
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';

	const message = $derived(page.error?.message ?? 'Something went wrong while loading this page.');
</script>

<div
	class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
>
	<TriangleAlert class="size-6 text-muted-foreground" />
	<h2 class="text-xl font-semibold">Could not load notes</h2>
	<p class="text-sm text-muted-foreground">{message}</p>
	<Button variant="outline" size="sm" onclick={() => invalidateAll()}>Try again</Button>
</div>
