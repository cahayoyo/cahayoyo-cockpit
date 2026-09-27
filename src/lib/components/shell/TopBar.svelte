<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Menu from '@lucide/svelte/icons/menu';
	import Moon from '@lucide/svelte/icons/moon';
	import PanelLeftClose from '@lucide/svelte/icons/panel-left-close';
	import PanelLeftOpen from '@lucide/svelte/icons/panel-left-open';
	import Sun from '@lucide/svelte/icons/sun';
	import { onMount } from 'svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
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

	const isDark = $derived(mode.current === 'dark');

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

	<div class="flex items-center gap-1.5">
		<Sun class="size-4 text-muted-foreground" />
		<button
			type="button"
			role="switch"
			aria-checked={isDark}
			aria-label="Toggle dark mode"
			onclick={toggleMode}
			class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border bg-muted px-0.5 transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
		>
			<span
				class={cn(
					'size-5 rounded-full bg-background shadow-sm transition-transform duration-200 ease-standard motion-reduce:transition-none',
					isDark && 'translate-x-5'
				)}
			></span>
		</button>
		<Moon class="size-4 text-muted-foreground" />
	</div>

	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button variant="ghost" size="sm" class="min-h-11 gap-2 sm:min-h-7" {...props}>
					<span
						class="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-medium text-accent-foreground"
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
