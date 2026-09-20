<script lang="ts">
	// Dashboard widget: count chips for the four active statuses plus up to five
	// items; the selection and counts come from $lib/dashboard/select.
	import SquareCheckBig from '@lucide/svelte/icons/square-check-big';
	import { resolve } from '$app/paths';
	import type { TaskItem } from '$lib/components/tasks/types.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ACTIVE_TASK_STATUSES, type ActiveTaskStatus } from '$lib/dashboard/select.js';
	import { STATUS_META } from '$lib/tasks/presentation.js';
	import WidgetCard from './WidgetCard.svelte';

	let {
		tasks,
		counts
	}: {
		tasks: TaskItem[];
		counts: Partial<Record<ActiveTaskStatus, number>>;
	} = $props();
</script>

<WidgetCard title="Active tasks" href="/tasks?status=active">
	<div class="space-y-3">
		{#if tasks.length === 0}
			<div class="flex flex-col items-center gap-3 py-4 text-center">
				<SquareCheckBig class="size-6 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">No active tasks.</p>
				<Button
					variant="outline"
					size="sm"
					class="max-sm:h-11"
					href={resolve('/tasks?status=active')}
				>
					View tasks
				</Button>
			</div>
		{:else}
			<div class="flex flex-wrap gap-1.5">
				{#each ACTIVE_TASK_STATUSES as status (status)}
					<Badge variant="outline" class={STATUS_META[status].badge}>
						{STATUS_META[status].label}
						<span class="ml-1 tabular-nums">{counts[status] ?? 0}</span>
					</Badge>
				{/each}
			</div>

			<ul class="space-y-2">
				{#each tasks as task (task.id)}
					<li class="flex items-center gap-2">
						<a
							href={resolve(`/tasks?task=${task.id}`)}
							class="flex min-w-0 flex-1 items-center text-sm hover:underline max-lg:min-h-11"
						>
							<span class="truncate">{task.title}</span>
						</a>
						<Badge variant="outline" class={STATUS_META[task.status].badge}>
							{STATUS_META[task.status].label}
						</Badge>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</WidgetCard>
