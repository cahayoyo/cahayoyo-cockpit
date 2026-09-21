<script lang="ts">
	// Masked secret + eye reveal toggle, shared by both list variants. The value
	// is only present while the page has it revealed (fetched from the no-store
	// reveal endpoint, never from load data).
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		value,
		revealed,
		error,
		onreveal
	}: {
		value: string | null;
		revealed: boolean;
		error: string;
		onreveal: () => void;
	} = $props();

	const masked = '••••••••••••';
</script>

<div class="flex min-w-0 flex-col items-end gap-0.5">
	<div class="flex items-center gap-1">
		<span
			class="max-w-44 truncate font-mono text-xs text-muted-foreground"
			aria-label={revealed ? 'Secret revealed' : 'Secret hidden'}
		>
			{revealed && value ? value : masked}
		</span>
		<Button
			variant="ghost"
			size="icon-sm"
			class="shrink-0 max-lg:size-11"
			aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
			aria-pressed={revealed}
			title={revealed ? 'Hide secret' : 'Reveal secret'}
			onclick={onreveal}
		>
			{#if revealed}
				<EyeOff class="size-4" />
			{:else}
				<Eye class="size-4" />
			{/if}
		</Button>
	</div>
	{#if error}
		<p class="text-xs text-destructive">{error}</p>
	{/if}
</div>
