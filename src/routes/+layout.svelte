<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/logo/cahayoyo-mark.png" />
</svelte:head>

<ModeWatcher disableTransitions={false} />
{@render children()}
<Toaster />
