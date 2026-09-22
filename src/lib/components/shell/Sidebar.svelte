<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils.js';
	import { isActivePath, NAV_ITEMS } from './nav.js';

	let {
		expanded = $bindable(true),
		hovering = $bindable(false)
	}: { expanded?: boolean; hovering?: boolean } = $props();

	const path = $derived(page.url.pathname);
	const isExpanded = $derived(expanded || hovering);
	const labelOpacity = $derived(isExpanded ? 'opacity-100' : 'opacity-0');

	function handlePointerEnter(): void {
		if (!expanded) hovering = true;
	}

	function handlePointerLeave(): void {
		hovering = false;
	}
</script>

<aside
	class={cn(
		'hidden shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex',
		isExpanded ? 'w-60' : 'w-16'
	)}
	onmouseenter={handlePointerEnter}
	onmouseleave={handlePointerLeave}
>
	<div class="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
		<div class="grid size-8 shrink-0 place-items-center rounded-md bg-primary">
			<img src="/logo/cahayoyo-mark.png" alt="" class="size-5 brightness-0 invert" />
		</div>
		<span
			class={cn(
				'truncate text-sm font-semibold transition-opacity duration-200 motion-reduce:transition-none',
				labelOpacity
			)}
		>
			Cahayoyo Cockpit
		</span>
	</div>

	<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2" aria-label="Main">
		{#each NAV_ITEMS as item (item.href)}
			{@const active = isActivePath(path, item.href)}
			<a
				href={resolve(item.href)}
				aria-current={active ? 'page' : undefined}
				aria-label={isExpanded ? undefined : item.label}
				title={isExpanded ? undefined : item.label}
				class={cn(
					'relative flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none',
					active
						? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:left-0 before:h-4 before:w-0.5 before:rounded-full before:bg-sidebar-primary'
						: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
				)}
			>
				<item.icon class="size-4 shrink-0" />
				<span
					class={cn(
						'truncate transition-opacity duration-200 motion-reduce:transition-none',
						labelOpacity
					)}
				>
					{item.label}
				</span>
			</a>
		{/each}
	</nav>
</aside>
