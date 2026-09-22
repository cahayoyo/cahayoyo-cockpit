<script lang="ts">
	// V2 — data table: Title · Type · Username · Tags · Updated · secret +
	// actions. Scrolls horizontally on small screens instead of shrinking.
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

<div class="overflow-x-auto rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr class="border-b border-border text-left text-muted-foreground">
				<th class="px-3 py-2 font-medium">Title</th>
				<th class="px-3 py-2 font-medium">Type</th>
				<th class="px-3 py-2 font-medium">Username</th>
				<th class="px-3 py-2 font-medium">Tags</th>
				<th class="px-3 py-2 text-right font-medium">Updated</th>
				<th class="px-3 py-2 text-right font-medium">Secret</th>
			</tr>
		</thead>
		<tbody>
			{#each entries as entry (entry.id)}
				{@const isRevealed = revealed.has(entry.id)}
				<tr class="border-b border-border last:border-0 hover:bg-muted/50">
					<td class="px-3 py-2">
						<div class="flex min-w-0 items-center gap-2">
							<button
								type="button"
								class="min-w-0 truncate text-left font-medium hover:underline max-lg:min-h-11"
								onclick={() => onedit(entry)}
							>
								{entry.title}
							</button>
							{#if decryptFailed.has(entry.id)}
								<Badge variant="destructive" class="shrink-0">Cannot decrypt</Badge>
							{/if}
						</div>
					</td>
					<td class="px-3 py-2">
						<Badge variant="outline">{VAULT_TYPE_META[entry.type].label}</Badge>
					</td>
					<td class="px-3 py-2 text-muted-foreground">
						{#if entry.username}
							<div class="flex items-center gap-1">
								<span class="max-w-48 truncate font-mono">{entry.username}</span>
								<CopyButton value={entry.username} label="Username copied" class="size-6" />
							</div>
						{:else}
							—
						{/if}
					</td>
					<td class="px-3 py-2">
						<div class="flex flex-wrap items-center gap-1">
							{#each entry.tags as tag (tag)}
								<Badge variant="secondary">{tag}</Badge>
							{/each}
						</div>
					</td>
					<td class="px-3 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
						{dateInAppZone(entry.updatedAt)}
					</td>
					<td class="px-3 py-2">
						<div class="flex items-center justify-end gap-1">
							<SecretCell
								value={isRevealed ? (secrets[entry.id] ?? null) : null}
								revealed={isRevealed}
								error={revealErrors[entry.id] ?? ''}
								onreveal={() => onreveal(entry)}
							/>
							<VaultMenu {entry} {onedit} {oncopy} {ondelete} />
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
