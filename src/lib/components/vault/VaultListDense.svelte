<script lang="ts">
	// V1 — dense rows (emails-style): bold title + type badge, username, tag
	// chips, updated date, masked secret and actions on the right.
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { dateInAppZone } from '$lib/tasks/today.js';
	import { VAULT_TYPE_META } from '$lib/vault/presentation.js';
	import type { VaultEntryItem } from '$lib/vault/types.js';
	import SecretCell from './SecretCell.svelte';
	import VaultMenu from './VaultMenu.svelte';

	let {
		entries,
		revealed,
		secrets,
		revealErrors,
		decryptFailed,
		onedit,
		onreveal,
		oncopy,
		ondelete
	}: {
		entries: VaultEntryItem[];
		revealed: ReadonlySet<string>;
		secrets: Record<string, string>;
		revealErrors: Record<string, string>;
		decryptFailed: ReadonlySet<string>;
		onedit: (entry: VaultEntryItem) => void;
		onreveal: (entry: VaultEntryItem) => void;
		oncopy: (entry: VaultEntryItem) => void;
		ondelete: (entry: VaultEntryItem) => void;
	} = $props();
</script>

<div
	class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
>
	{#each entries as entry (entry.id)}
		{@const isRevealed = revealed.has(entry.id)}
		<div class="relative flex flex-col gap-1 px-3 py-2.5">
			<div class="flex min-w-0 items-center gap-2">
				<button
					type="button"
					class="min-w-0 max-w-full truncate text-left text-sm font-medium hover:underline max-lg:min-h-11"
					onclick={() => onedit(entry)}
				>
					{entry.title}
				</button>
				<Badge variant="outline" class="shrink-0">{VAULT_TYPE_META[entry.type].label}</Badge>
				{#if decryptFailed.has(entry.id)}
					<Badge variant="destructive" class="shrink-0">Cannot decrypt</Badge>
				{/if}
				<div class="ml-auto flex shrink-0 items-center gap-1">
					<SecretCell
						value={isRevealed ? (secrets[entry.id] ?? null) : null}
						revealed={isRevealed}
						error={revealErrors[entry.id] ?? ''}
						onreveal={() => onreveal(entry)}
					/>
					<VaultMenu {entry} {onedit} {oncopy} {ondelete} />
				</div>
			</div>
			<div
				class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
			>
				{#if entry.username}
					<span class="min-w-0 truncate font-mono">{entry.username}</span>
					<CopyButton value={entry.username} label="Username copied" class="relative z-10 size-6" />
				{/if}
				{#each entry.tags as tag (tag)}
					<Badge variant="secondary">{tag}</Badge>
				{/each}
				<span class="ml-auto shrink-0 tabular-nums">{dateInAppZone(entry.updatedAt)}</span>
			</div>
		</div>
	{/each}
</div>
