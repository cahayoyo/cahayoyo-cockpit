<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Menu from '@lucide/svelte/icons/menu';
	import Moon from '@lucide/svelte/icons/moon';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import Sun from '@lucide/svelte/icons/sun';
	import { onMount } from 'svelte';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { formatClock } from './clock.js';

	let {
		email,
		expanded,
		onToggle,
		onOpenNav
	}: {
		email?: string;
		expanded: boolean;
		onToggle: () => void;
		onOpenNav: () => void;
	} = $props();

	let signOutForm: HTMLFormElement | null = $state(null);
	let now = $state<Date | null>(null);

	onMount(() => {
		now = new Date();
		const id = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(id);
	});
</script>

<header class="flex h-14 items-center gap-2 border-b border-border px-4">
	<Button
		variant="ghost"
		size="icon-sm"
		class="size-11 sm:size-7 lg:hidden"
		aria-label="Open navigation"
		onclick={onOpenNav}
	>
		<Menu />
	</Button>

	<div class="flex shrink-0 items-center gap-2 lg:hidden">
		<img
			src="/logo/cahayoyo-logo-transparant.png"
			alt="Cahayoyo Cockpit"
			class="h-10 w-auto dark:hidden"
		/>
		<img
			src="/logo/cahayoyo-logo-inverse.png"
			alt="Cahayoyo Cockpit"
			class="hidden h-10 w-auto dark:block"
		/>
	</div>

	<Button
		variant="ghost"
		size="icon-sm"
		class="hidden size-7 lg:inline-flex"
		aria-expanded={expanded}
		aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
		title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
		onclick={onToggle}
	>
		{#if expanded}
			<PanelLeftClose />
		{:else}
			<PanelLeftOpen />
		{/if}
	</Button>

	<div class="flex-1"></div>

	{#if now}
		<time
			class="hidden text-xs text-muted-foreground tabular-nums md:inline"
			datetime={now.toISOString()}
		>
			{formatClock(now)}
		</time>
	{/if}

	<Button
		variant="ghost"
		size="icon-sm"
		class="size-11 sm:size-7"
		aria-label="Toggle theme"
		onclick={toggleMode}
	>
		<Moon class="dark:hidden" />
		<Sun class="hidden dark:block" />
	</Button>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="sm" class="min-h-11 gap-2 sm:min-h-7" {...props}>
					<span
						class="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium"
					>
						{email?.slice(0, 1).toUpperCase() ?? '?'}
					</span>
					<span class="hidden max-w-40 truncate sm:inline">{email}</span>
					<ChevronDown class="size-4 text-muted-foreground" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Label class="truncate">{email}</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onSelect={() => signOutForm?.requestSubmit()}>
				<LogOut />
				Log out
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</header>

<form method="POST" action="/logout" bind:this={signOutForm} class="hidden"></form>
