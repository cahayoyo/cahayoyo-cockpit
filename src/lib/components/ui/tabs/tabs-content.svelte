<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsPrimitive.ContentProps & { children: Snippet } = $props();
</script>

<TabsPrimitive.Content bind:ref class={cn('outline-none', className)} {...restProps}>
	{@render children()}
</TabsPrimitive.Content>
