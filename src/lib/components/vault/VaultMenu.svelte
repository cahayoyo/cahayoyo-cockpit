<script lang="ts">
	// Kebab actions shared by both list variants: Edit, Copy password (gated by
	// the page) and Delete (behind the confirm dialog).
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { VaultEntryItem } from '$lib/vault/types.js';

	let {
		entry,
		onedit,
		oncopy,
		ondelete
	}: {
		entry: VaultEntryItem;
		onedit: (entry: VaultEntryItem) => void;
		oncopy: (entry: VaultEntryItem) => void;
		ondelete: (entry: VaultEntryItem) => void;
	} = $props();
</script>

<div class="relative z-10">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon-sm"
					class="shrink-0 max-lg:size-11"
					aria-label="Entry actions"
					{...props}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item onSelect={() => onedit(entry)}>Edit</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => oncopy(entry)}>Copy password</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(entry)}>
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
