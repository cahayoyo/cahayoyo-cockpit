<script lang="ts">
	// Tasks page: toolbar (project Select, view toggle, filters, sort, search,
	// New task), All-tasks list, one-project kanban, project manager and the task
	// detail dialog. Every view is derived from the single task list the load
	// returns, so subtask progress and parent labels never depend on the filters;
	// the URL stays the source of truth for filters, sort, search and `?task=`.
	import Columns3 from '@lucide/svelte/icons/columns-3';
	import SearchX from '@lucide/svelte/icons/search-x';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ProjectManagerDialog from '$lib/components/tasks/ProjectManagerDialog.svelte';
	import TaskDetailDialog from '$lib/components/tasks/TaskDetailDialog.svelte';
	import TaskKanban from '$lib/components/tasks/TaskKanban.svelte';
	import TaskList from '$lib/components/tasks/TaskList.svelte';
	import TaskToolbar from '$lib/components/tasks/TaskToolbar.svelte';
	import type { TaskFilterPatch, TaskItem } from '$lib/components/tasks/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { submitAction } from '$lib/forms.js';
	import {
		filterTasks,
		normalizePriorityFilter,
		normalizeStatusFilter,
		sortTasks
	} from '$lib/tasks/filters.js';
	import { buildTaskSearch, type TaskSearch } from '$lib/tasks/params.js';
	import { deleteTaskDescription } from '$lib/tasks/presentation.js';
	import { groupByParent, subtaskProgress } from '$lib/tasks/subtasks.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	let managingProjects = $state(false);
	let creating = $state(false);
	let confirming = $state<TaskItem | null>(null);
	let confirmOpen = $state(false);

	const loading = $derived(navigating.to !== null);
	const inboxId = $derived(data.projects.find((project) => project.isInbox)?.id ?? '');

	// URL filters degrade gracefully: an unknown project falls back to All tasks,
	// unknown status/priority values to the server defaults (Active / Any).
	const filters = $derived.by<TaskSearch>(() => ({
		...data.filters,
		projectId: data.projects.some((project) => project.id === data.filters.projectId)
			? data.filters.projectId
			: null,
		status: normalizeStatusFilter(data.filters.status, data.statusValues),
		priority: normalizePriorityFilter(data.filters.priority, data.priorityValues)
	}));
	const view = $derived(data.view === 'kanban' && filters.projectId !== null ? 'kanban' : 'list');
	const selected = $derived(data.tasks.find((task) => task.id === data.filters.taskId) ?? null);

	const childrenOf = $derived(groupByParent(data.tasks));
	const progressOf = (id: string) => subtaskProgress(childrenOf.get(id) ?? []);

	const parents = $derived(data.tasks.filter((task) => task.parentId === null));
	const items = $derived(
		sortTasks(filterTasks(parents, filters, data.today), filters.sort, data.priorityValues)
	);
	const boardCount = $derived(
		filters.projectId === null
			? 0
			: parents.filter((task) => task.projectId === filters.projectId).length
	);
	const hasFilters = $derived(
		filters.status !== 'active' ||
			filters.priority !== 'all' ||
			filters.tag !== null ||
			filters.due !== 'any' ||
			filters.q.trim() !== ''
	);
	const dialogOpen = $derived(creating || selected !== null);

	function apply(patch: TaskFilterPatch): void {
		const projectId = patch.projectId === undefined ? filters.projectId : patch.projectId;
		const query = buildTaskSearch(
			{
				projectId,
				status: patch.status ?? filters.status,
				priority: patch.priority ?? filters.priority,
				tag: patch.tag === undefined ? filters.tag : patch.tag,
				due: patch.due ?? filters.due,
				q: patch.q ?? filters.q,
				sort: patch.sort ?? filters.sort,
				taskId: patch.taskId === undefined ? filters.taskId : patch.taskId
			},
			patch.view ?? (patch.projectId === null ? 'list' : view)
		);

		void goto(resolve(query ? `/tasks?${query}` : '/tasks'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	async function changeStatus(task: TaskItem, status: string): Promise<void> {
		const outcome = await submitAction('?/setTaskStatus', { id: task.id, status });
		if (!outcome.ok) toast.error(outcome.message);
	}

	function openDetail(task: TaskItem): void {
		apply({ taskId: task.id });
	}

	function openCreate(): void {
		creating = true;
	}

	function closeDialog(): void {
		creating = false;
		apply({ taskId: null });
	}

	function askDelete(task: TaskItem): void {
		confirming = task;
		confirmOpen = true;
	}

	function afterDelete(): void {
		if (confirming && confirming.id === filters.taskId) apply({ taskId: null });
		confirming = null;
	}

	function selectProject(projectId: string): void {
		apply({ projectId, taskId: null });
	}

	function afterProjectDelete(projectId: string): void {
		if (filters.projectId === projectId) apply({ projectId: null, taskId: null });
	}
</script>

<TaskToolbar
	projectId={filters.projectId}
	status={filters.status}
	priority={filters.priority}
	due={filters.due}
	sort={filters.sort}
	q={filters.q}
	{view}
	projects={data.projects}
	onpatch={apply}
	onmanage={() => (managingProjects = true)}
	onnew={openCreate}
/>

{#if loading}
	{#if view === 'kanban'}
		<div class="flex gap-3 overflow-hidden" aria-busy="true">
			{#each [0, 1, 2, 3, 4, 5] as key (key)}
				<Skeleton class="h-72 w-72 shrink-0 rounded-xl" />
			{/each}
		</div>
	{:else}
		<div class="space-y-2" aria-busy="true">
			{#each [0, 1, 2, 3, 4] as key (key)}
				<Skeleton class="h-14 w-full rounded-xl" />
			{/each}
		</div>
	{/if}
{:else if view === 'kanban'}
	{#if boardCount === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
		>
			<Columns3 class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No tasks in this project yet.</p>
			<Button variant="outline" size="sm" onclick={openCreate}>New task</Button>
		</div>
	{:else}
		<TaskKanban
			tasks={data.tasks}
			projectId={filters.projectId ?? ''}
			today={data.today}
			{progressOf}
			onopen={openDetail}
			ondelete={askDelete}
		/>
	{/if}
{:else if items.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
	>
		<SearchX class="size-6 text-muted-foreground" />
		<p class="text-sm text-muted-foreground">
			{data.tasks.length === 0
				? 'No tasks yet. Create your first one.'
				: 'No tasks match these filters.'}
		</p>
		{#if hasFilters}
			<Button
				variant="outline"
				size="sm"
				onclick={() => apply({ status: 'active', priority: 'all', tag: null, due: 'any', q: '' })}
			>
				Clear filters
			</Button>
		{:else if data.tasks.length === 0}
			<Button variant="outline" size="sm" onclick={openCreate}>New task</Button>
		{/if}
	</div>
{:else}
	<TaskList
		{items}
		projects={data.projects}
		showProject={filters.projectId === null}
		today={data.today}
		{progressOf}
		onopen={openDetail}
		onstatuschange={changeStatus}
		ondelete={askDelete}
	/>
{/if}

<TaskDetailDialog
	open={dialogOpen}
	task={selected}
	subtasks={selected ? (childrenOf.get(selected.id) ?? []) : []}
	projects={data.projects}
	tags={data.tags}
	defaultProjectId={filters.projectId ?? inboxId}
	onclose={closeDialog}
/>

<ProjectManagerDialog
	bind:open={managingProjects}
	projects={data.projects}
	onselect={selectProject}
	ondeleted={afterProjectDelete}
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
