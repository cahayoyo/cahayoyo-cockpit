<script lang="ts">
	// Shared copy action: clipboard API + success toast + Copy→Check icon swap
	// (1500 ms) + aria-label swap. One instance per output value.
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		value,
		label = 'Copied',
		disabled = false,
		class: className
	}: {
		value: string;
		label?: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy(): Promise<void> {
		if (value === '') return;

		try {
			await navigator.clipboard.writeText(value);
		} catch {
			toast.error('Could not copy to the clipboard.');
			return;
		}

		copied = true;
		toast.success(label);
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<Button
	variant="ghost"
	size="icon"
	class={cn('max-lg:size-11 shrink-0', className)}
	aria-label={copied ? 'Copied' : 'Copy'}
	title={copied ? 'Copied' : 'Copy'}
	{disabled}
	onclick={copy}
>
	{#if copied}
		<Check class="size-4 text-primary" />
	{:else}
		<Copy class="size-4" />
	{/if}
</Button>
