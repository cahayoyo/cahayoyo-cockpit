<script lang="ts">
	// Shared widget chrome: title, a "View all" link into the full page, and the
	// content slot. One card = one widget (DESIGN.md > Card).
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';

	// Internal routes the "View all" link opens; keeping them literal makes a
	// typo in a caller fail the check (resolve() only accepts known routes).
	type WidgetHref =
		| '/today'
		| '/notes'
		| '/bookmarks?favorite=true'
		| '/tasks?status=active'
		| `/tasks?task=${string}`
		| `/notes?note=${string}`;

	let {
		title,
		href,
		linkLabel = 'View all',
		children
	}: {
		title: string;
		href: WidgetHref;
		linkLabel?: string;
		children: Snippet;
	} = $props();
</script>

<Card.Card class="h-full">
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Action>
			<a
				href={resolve(href)}
				class="inline-flex items-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline max-lg:min-h-11"
			>
				{linkLabel}
			</a>
		</Card.Action>
	</Card.Header>
	<Card.Content class="flex-1">
		{@render children()}
	</Card.Content>
</Card.Card>
