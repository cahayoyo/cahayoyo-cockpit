<script lang="ts">
	// Kebab actions shared by list rows and kanban cards: Move to (any status,
	// free transitions) + Delete behind a confirm.
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { STATUS_META, STATUS_ORDER, type TaskStatus } from '$lib/tasks/presentation.js';
	import type { TaskItem } from './types.js';

	let {
		task,
		onmove,
		ondelete
	}: {
		task: TaskItem;
		onmove: (task: TaskItem, status: TaskStatus) => void;
		ondelete: (task: TaskItem) => void;
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
					aria-label="Task actions"
					{...props}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Move to</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					{#each STATUS_ORDER as option (option)}
						<DropdownMenu.Item
							disabled={option === task.status}
							onSelect={() => onmove(task, option)}
						>
							{STATUS_META[option].label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(task)}>
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
