<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { isActivePath, NAV_ITEMS } from './nav.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const path = $derived(page.url.pathname);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="left" class="w-72 bg-sidebar text-sidebar-foreground">
		<Sheet.Header class="gap-3">
			<img
				src="/logo/cahayoyo-logo-transparant.png"
				alt="Cahayoyo"
				class="h-12 w-auto self-start dark:hidden"
			/>
			<img
				src="/logo/cahayoyo-logo-inverse.png"
				alt="Cahayoyo"
				class="hidden h-12 w-auto self-start dark:block"
			/>
			<Sheet.Title class="sr-only">Navigation</Sheet.Title>
		</Sheet.Header>
		<nav class="flex-1 space-y-1 px-2" aria-label="Main">
			{#each NAV_ITEMS as item (item.href)}
				{@const active = isActivePath(path, item.href)}
				<a
					href={resolve(item.href)}
					aria-current={active ? 'page' : undefined}
					class={cn(
						'relative flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors motion-reduce:transition-none',
						active
							? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:left-0 before:h-5 before:w-0.5 before:rounded-full before:bg-sidebar-primary'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
					)}
					onclick={() => (open = false)}
				>
					<item.icon class="size-4" />
					{item.label}
				</a>
			{/each}
		</nav>
	</Sheet.Content>
</Sheet.Root>
