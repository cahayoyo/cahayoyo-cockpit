<script lang="ts">
	// Dashboard widget: tasks due today or overdue with quick add (Inbox, Backlog,
	// due today). The cap and "+N more" count come from $lib/dashboard/select.
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import Plus from '@lucide/svelte/icons/plus';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import type { TaskItem } from '$lib/components/tasks/types.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { failureMessage } from '$lib/forms.js';
	import { STATUS_META } from '$lib/tasks/presentation.js';
	import { cn } from '$lib/utils.js';
	import WidgetCard from './WidgetCard.svelte';

	let {
		tasks,
		today,
		hidden = 0
	}: {
		tasks: TaskItem[];
		today: string;
		hidden?: number;
	} = $props();

	let draft = $state('');
	let input = $state<HTMLInputElement | null>(null);
</script>

<WidgetCard title="Today" href="/today">
	<div class="space-y-3">
		<form
			class="flex items-center gap-2"
			method="post"
			action="?/quickAdd"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						toast.error(failureMessage(result.data));
						return;
					}

					await update();
					draft = '';
				}}
		>
			<Input
				bind:ref={input}
				name="title"
				bind:value={draft}
				placeholder="Add a task due today…"
				aria-label="Quick add task"
			/>
			<Button type="submit" size="sm" disabled={draft.trim() === ''}>
				<Plus class="size-4" />
				Add
			</Button>
		</form>

		{#if tasks.length === 0}
			<div class="flex flex-col items-center gap-3 py-4 text-center">
				<CalendarCheck class="size-6 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">Nothing due today or overdue.</p>
				<Button variant="outline" size="sm" onclick={() => input?.focus()}>Add a task</Button>
			</div>
		{:else}
			<ul class="space-y-2">
				{#each tasks as task (task.id)}
					<li class="flex items-center gap-2">
						<a
							href={resolve(`/tasks?task=${task.id}`)}
							class="min-w-0 flex-1 truncate text-sm hover:underline"
						>
							{task.title}
						</a>
						<Badge variant="outline" class={STATUS_META[task.status].badge}>
							{STATUS_META[task.status].label}
						</Badge>
						<span
							class={cn(
								'shrink-0 text-xs tabular-nums',
								task.dueDate !== null && task.dueDate < today
									? 'font-medium text-destructive'
									: 'text-muted-foreground'
							)}
						>
							{task.dueDate}
						</span>
					</li>
				{/each}
			</ul>
			{#if hidden > 0}
				<a
					href={resolve('/today')}
					class="block text-xs text-muted-foreground hover:text-foreground"
				>
					+{hidden} more
				</a>
			{/if}
		{/if}
	</div>
</WidgetCard>
