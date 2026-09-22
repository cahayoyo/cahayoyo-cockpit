<script lang="ts">
	import { page } from '$app/state';
	import MobileNav from '$lib/components/shell/MobileNav.svelte';
	import Sidebar from '$lib/components/shell/Sidebar.svelte';
	import TopBar from '$lib/components/shell/TopBar.svelte';
	import { currentLabel } from '$lib/components/shell/nav.js';
	import type { LayoutProps } from './$types.js';

	let { data, children }: LayoutProps = $props();

	let navOpen = $state(false);
	let expanded = $state(true);
	let hovering = $state(false);

	const path = $derived(page.url.pathname);
	const pageTitle = $derived(`Cahayoyo Cockpit - ${currentLabel(path)}`);

	function toggleSidebar(): void {
		expanded = !expanded;
		hovering = false;
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="flex min-h-svh bg-background">
	<Sidebar bind:expanded bind:hovering />

	<div class="flex min-w-0 flex-1 flex-col">
		<TopBar
			email={data.user?.email}
			{expanded}
			onToggle={toggleSidebar}
			onOpenNav={() => (navOpen = true)}
		/>

		<main class="flex-1 overflow-y-auto">
			<div class="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-16">
				<h1 class="text-3xl font-semibold tracking-tight">{currentLabel(path)}</h1>
				{@render children()}
			</div>
		</main>
	</div>
</div>

<MobileNav bind:open={navOpen} />
