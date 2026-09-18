<script lang="ts">
	// Today view: tasks due today or overdue (app timezone) and not Done, plus a
	// quick add that lands in Inbox. Subtasks appear with a parent label. The
	// detail dialog is the same component the Tasks page uses.
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import Plus from '@lucide/svelte/icons/plus';
	import { enhance } from '$app/forms';
	import { navigating } from '$app/state';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import TaskDetailDialog from '$lib/components/tasks/TaskDetailDialog.svelte';
	import TaskRow from '$lib/components/tasks/TaskRow.svelte';
	import type { TaskItem } from '$lib/components/tasks/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { failureMessage, submitAction } from '$lib/forms.js';
	import { filterTasks, type TaskFilters } from '$lib/tasks/filters.js';
	import { deleteTaskDescription, projectName } from '$lib/tasks/presentation.js';
	import { groupByParent, subtaskProgress } from '$lib/tasks/subtasks.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	// Due today or earlier, Done excluded via the Active status filter (grill Q5).
	const TODAY_FILTERS: TaskFilters = {
		projectId: null,
		status: 'active',
		priority: 'all',
		tag: null,
		due: 'today_or_overdue',
		q: '',
		sort: 'due'
	};

	let quickTitle = $state('');
	let quickInput = $state<HTMLInputElement | null>(null);
	let selectedId = $state<string | null>(null);
	let confirming = $state<TaskItem | null>(null);
	let confirmOpen = $state(false);

	const loading = $derived(navigating.to !== null);
	// The list is already due-date sorted (server sort); filtering preserves it.
	const items = $derived(filterTasks(data.tasks, TODAY_FILTERS, data.today));
	const selected = $derived(data.tasks.find((task) => task.id === selectedId) ?? null);

	const childrenOf = $derived(groupByParent(data.tasks));
	const progressOf = (id: string) => subtaskProgress(childrenOf.get(id) ?? []);
	const parentTitle = (task: TaskItem): string | undefined =>
		task.parentId === null
			? undefined
			: data.tasks.find((parent) => parent.id === task.parentId)?.title || 'Untitled';

	async function changeStatus(task: TaskItem, status: string): Promise<void> {
		const outcome = await submitAction('?/setTaskStatus', { id: task.id, status });
		if (!outcome.ok) toast.error(outcome.message);
	}

	function askDelete(task: TaskItem): void {
		confirming = task;
		confirmOpen = true;
	}

	function afterDelete(): void {
		if (confirming && confirming.id === selectedId) selectedId = null;
		confirming = null;
	}
</script>

<form
	class="flex flex-wrap items-center gap-2"
	method="post"
	action="?/quickAdd"
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				toast.error(failureMessage(result.data));
				return;
			}

			await update();
			quickTitle = '';
		}}
>
	<Input
		bind:ref={quickInput}
		name="title"
		bind:value={quickTitle}
		placeholder="Add a task due today…"
		class="w-full sm:max-w-sm"
		aria-label="Quick add task"
	/>
	<Button type="submit" disabled={quickTitle.trim() === ''}>
		<Plus class="size-4" />
		Add
	</Button>
</form>

{#if loading}
	<div class="space-y-2" aria-busy="true">
		{#each [0, 1, 2, 3] as key (key)}
			<Skeleton class="h-14 w-full rounded-xl" />
		{/each}
	</div>
{:else if items.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
	>
		<CalendarCheck class="size-6 text-muted-foreground" />
		<p class="text-sm text-muted-foreground">Nothing due today or overdue.</p>
		<Button variant="outline" size="sm" onclick={() => quickInput?.focus()}>Add a task</Button>
	</div>
{:else}
	<div
		class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
	>
		{#each items as task (task.id)}
			<TaskRow
				{task}
				today={data.today}
				progress={progressOf(task.id)}
				projectName={projectName(data.projects, task.projectId)}
				parentTitle={parentTitle(task)}
				onopen={(opened) => (selectedId = opened.id)}
				onstatuschange={changeStatus}
				ondelete={askDelete}
			/>
		{/each}
	</div>
{/if}

<TaskDetailDialog
	open={selected !== null}
	task={selected}
	subtasks={selected ? (childrenOf.get(selected.id) ?? []) : []}
	projects={data.projects}
	tags={data.tags}
	defaultProjectId={data.projects.find((project) => project.isInbox)?.id ?? ''}
	onclose={() => (selectedId = null)}
/>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete task"
	description={confirming ? deleteTaskDescription(confirming) : ''}
	confirmLabel="Delete task"
	action="?/deleteTask"
	fields={confirming ? { id: confirming.id } : {}}
	successMessage="Task deleted"
	onsuccess={afterDelete}
/>
