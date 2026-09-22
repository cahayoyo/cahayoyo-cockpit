<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsPrimitive.ListProps & { children: Snippet } = $props();
</script>

<TabsPrimitive.List
	bind:ref
	class={cn(
		'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg border border-transparent p-1',
		className
	)}
	{...restProps}
>
	{@render children()}
</TabsPrimitive.List>
