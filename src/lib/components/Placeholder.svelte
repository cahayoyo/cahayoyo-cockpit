<script lang="ts">
	import type { Component } from 'svelte';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';

	let {
		icon: Icon,
		description,
		note
	}: {
		icon: Component;
		description: string;
		note?: string;
	} = $props();
</script>

<Card>
	<CardContent class="flex items-start gap-3">
		<Icon class="size-6 shrink-0 text-muted-foreground" />
		<div class="space-y-1">
			<p class="text-sm text-muted-foreground">{description}</p>
			{#if note}
				<p class="text-xs text-muted-foreground">{note}</p>
			{/if}
		</div>
	</CardContent>
</Card>
