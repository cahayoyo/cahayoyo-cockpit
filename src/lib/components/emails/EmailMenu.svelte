<script lang="ts">
	// Kebab actions shared by the email rows: Edit, Mark dead ↔ Activate, Delete
	// (behind the confirm dialog the page owns).
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { EmailItem } from '$lib/emails/types.js';

	let {
		email,
		onedit,
		ontoggle,
		ondelete
	}: {
		email: EmailItem;
		onedit: (email: EmailItem) => void;
		ontoggle: (email: EmailItem) => void;
		ondelete: (email: EmailItem) => void;
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
					aria-label="Email actions"
					{...props}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item onSelect={() => onedit(email)}>Edit</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => ontoggle(email)}>
				{email.status === 'active' ? 'Mark dead' : 'Activate'}
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(email)}>
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
