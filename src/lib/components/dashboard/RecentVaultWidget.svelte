<script lang="ts">
	// Dashboard widget: the 5 most recently updated vault entries (metadata only —
	// title + type; selection happens in $lib/dashboard/select). Vault has no
	// per-entry deep link, so rows are display-only and "View all" opens /vault.
	import Lock from '@lucide/svelte/icons/lock';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { VAULT_TYPE_META } from '$lib/vault/presentation.js';
	import type { VaultEntryItem } from '$lib/vault/types.js';
	import WidgetCard from './WidgetCard.svelte';

	let { entries }: { entries: VaultEntryItem[] } = $props();
</script>

<WidgetCard title="Recent vault" href="/vault" icon={Lock}>
	{#if entries.length === 0}
		<div class="flex flex-col items-center gap-3 py-4 text-center">
			<Lock class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No vault entries yet.</p>
			<Button variant="outline" size="sm" class="max-sm:h-11" href={resolve('/vault')}>
				Open vault
			</Button>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each entries as entry (entry.id)}
				<li class="flex items-center gap-2">
					<span class="min-w-0 flex-1 truncate text-sm">{entry.title}</span>
					<Badge variant="outline" class="shrink-0">{VAULT_TYPE_META[entry.type].label}</Badge>
				</li>
			{/each}
		</ul>
	{/if}
</WidgetCard>
