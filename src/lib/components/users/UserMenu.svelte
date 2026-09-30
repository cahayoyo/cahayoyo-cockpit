<script lang="ts">
	// Kebab actions for one account row: reset password, deactivate or
	// reactivate, and (for another account) delete. The page owns the dialogs;
	// this only raises the intent.
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { AccountListItem } from '$lib/users/types.js';

	let {
		account,
		currentUserId,
		onreset,
		ontoggle,
		ondelete
	}: {
		account: AccountListItem;
		currentUserId?: string;
		onreset: (account: AccountListItem) => void;
		ontoggle: (account: AccountListItem) => void;
		ondelete: (account: AccountListItem) => void;
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
					aria-label="Account actions"
					{...props}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item onSelect={() => onreset(account)}>Reset password</DropdownMenu.Item>
			<DropdownMenu.Separator />
			{#if account.banned}
				<DropdownMenu.Item onSelect={() => ontoggle(account)}>Reactivate</DropdownMenu.Item>
			{:else}
				<DropdownMenu.Item variant="destructive" onSelect={() => ontoggle(account)}>
					Deactivate
				</DropdownMenu.Item>
			{/if}
			{#if account.id !== currentUserId}
				<DropdownMenu.Separator />
				<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(account)}>
					Delete
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
