<script lang="ts">
	// One task row (list views): title, optional project/parent label, due date,
	// subtask progress, tags, status + priority badges, kebab (Move to / Delete).
	// The title button stretches over the row, like the bookmark list rows.
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { PRIORITY_META, STATUS_META } from '$lib/tasks/presentation.js';
	import { cn } from '$lib/utils.js';
	import TaskMenu from './TaskMenu.svelte';
	import type { TaskItem, TaskProgress } from './types.js';

	let {
		task,
		today,
		progress,
		projectName,
		parentTitle,
		onopen,
		onstatuschange,
		ondelete
	}: {
		task: TaskItem;
		today: string;
		progress: TaskProgress;
		projectName?: string;
		parentTitle?: string;
		onopen: (task: TaskItem) => void;
		onstatuschange: (task: TaskItem, status: string) => void;
		ondelete: (task: TaskItem) => void;
	} = $props();

	const overdue = $derived(task.dueDate !== null && task.dueDate < today && task.status !== 'done');
</script>

<div class="relative flex items-center gap-3 px-3 py-2.5">
	<div class="min-w-0 flex-1">
		<button
			type="button"
			class="block max-w-full truncate text-left text-sm font-medium after:absolute after:inset-0"
			onclick={() => onopen(task)}
		>
			{task.title || 'Untitled'}
		</button>
		<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
			{#if projectName}
				<span>{projectName}</span>
				<span aria-hidden="true">·</span>
			{/if}
			{#if parentTitle}
				<span>↳ {parentTitle}</span>
				<span aria-hidden="true">·</span>
			{/if}
			{#if task.dueDate}
				<span class={cn(overdue && 'font-medium text-destructive')}>{task.dueDate}</span>
			{:else}
				<span>No due date</span>
			{/if}
			{#if progress.total > 0}
				<span>{progress.done}/{progress.total}</span>
			{/if}
			{#each task.tags as tag (tag)}
				<Badge variant="secondary">{tag}</Badge>
			{/each}
		</div>
	</div>

	<Badge variant="outline" class={STATUS_META[task.status].badge}>
		{STATUS_META[task.status].label}
	</Badge>
	<Badge variant="outline" class={PRIORITY_META[task.priority].badge}>
		{PRIORITY_META[task.priority].label}
	</Badge>

	<TaskMenu {task} onmove={onstatuschange} {ondelete} />
</div>
