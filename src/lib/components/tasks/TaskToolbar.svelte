<script lang="ts">
	// Tasks toolbar: project Select + manage dialog, list/kanban toggle, filters,
	// sort, debounced search, New task. Every control writes the URL; the page
	// reads it back (bookmarks/notes pattern).
	import Columns3 from '@lucide/svelte/icons/columns-3';
	import List from '@lucide/svelte/icons/list';
	import Plus from '@lucide/svelte/icons/plus';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { onDestroy, untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { DueFilter, SortKey } from '$lib/tasks/filters.js';
	import type { TaskView } from '$lib/tasks/params.js';
	import {
		PRIORITY_META,
		PRIORITY_ORDER,
		STATUS_META,
		STATUS_ORDER,
		type TaskPriority,
		type TaskStatus
	} from '$lib/tasks/presentation.js';
	import type { ProjectItem, TaskFilterPatch } from './types.js';

	let {
		projectId,
		status,
		priority,
		due,
		sort,
		q,
		view,
		projects,
		onpatch,
		onmanage,
		onnew
	}: {
		projectId: string | null;
		status: string;
		priority: string;
		due: DueFilter;
		sort: SortKey;
		q: string;
		view: TaskView;
		projects: ProjectItem[];
		onpatch: (patch: TaskFilterPatch) => void;
		onmanage: () => void;
		onnew: () => void;
	} = $props();

	const DUE_LABELS: Record<DueFilter, string> = {
		any: 'Any due date',
		overdue: 'Overdue',
		today: 'Due today',
		today_or_overdue: 'Due today or overdue',
		next7: 'Next 7 days',
		none: 'No due date'
	};

	// The toolbar omits `today_or_overdue`, which only the Today view uses.
	const DUE_OPTIONS: readonly DueFilter[] = ['any', 'overdue', 'today', 'next7', 'none'];

	function projectLabel(): string {
		if (projectId === null) return 'All tasks';
		return projects.find((project) => project.id === projectId)?.name ?? 'All tasks';
	}

	function statusLabel(): string {
		if (status === 'active') return 'Active';
		if (status === 'all') return 'All statuses';
		return STATUS_META[status as TaskStatus]?.label ?? 'Active';
	}

	function priorityLabel(): string {
		if (priority === 'all') return 'Any priority';
		return PRIORITY_META[priority as TaskPriority]?.label ?? 'Any priority';
	}

	// 300ms debounce; the emitted value is remembered so external URL changes
	// (clear, back button) reset the local input.
	let draft = $state(untrack(() => q));
	let emitted = $state(untrack(() => q));
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (q === emitted) return;
		clearTimeout(timer);
		draft = q;
		emitted = q;
	});

	function onSearchInput(): void {
		clearTimeout(timer);
		timer = setTimeout(() => {
			emitted = draft;
			onpatch({ q: draft });
		}, 300);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<div class="flex flex-wrap items-center gap-2">
	<Select.Root
		type="single"
		value={projectId ?? 'all'}
		onValueChange={(value) => onpatch({ projectId: value === 'all' ? null : value })}
	>
		<Select.Trigger class="w-44" aria-label="Project">
			{projectLabel()}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="all" label="All tasks">All tasks</Select.Item>
			{#each projects as project (project.id)}
				<Select.Item value={project.id} label={project.name}>{project.name}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Button
		variant="outline"
		size="icon"
		class="max-lg:size-11"
		aria-label="Manage projects"
		title="Manage projects"
		onclick={onmanage}
	>
		<Settings2 class="size-4" />
	</Button>

	<div class="flex items-center gap-0.5 rounded-lg border p-0.5">
		<Button
			variant={view === 'list' ? 'secondary' : 'ghost'}
			size="icon-sm"
			class="max-lg:size-11"
			aria-label="List view"
			aria-pressed={view === 'list'}
			onclick={() => onpatch({ view: 'list' })}
		>
			<List class="size-4" />
		</Button>
		<Button
			variant={view === 'kanban' ? 'secondary' : 'ghost'}
			size="icon-sm"
			class="max-lg:size-11"
			aria-label="Kanban view"
			aria-pressed={view === 'kanban'}
			disabled={projectId === null}
			title={projectId === null ? 'Pick a project to open the board' : undefined}
			onclick={() => onpatch({ view: 'kanban' })}
		>
			<Columns3 class="size-4" />
		</Button>
	</div>

	<Select.Root type="single" value={status} onValueChange={(value) => onpatch({ status: value })}>
		<Select.Trigger aria-label="Filter by status">{statusLabel()}</Select.Trigger>
		<Select.Content>
			<Select.Item value="active" label="Active">Active</Select.Item>
			<Select.Item value="all" label="All statuses">All statuses</Select.Item>
			{#each STATUS_ORDER as option (option)}
				<Select.Item value={option} label={STATUS_META[option].label}>
					{STATUS_META[option].label}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root
		type="single"
		value={priority}
		onValueChange={(value) => onpatch({ priority: value })}
	>
		<Select.Trigger aria-label="Filter by priority">{priorityLabel()}</Select.Trigger>
		<Select.Content>
			<Select.Item value="all" label="Any priority">Any priority</Select.Item>
			{#each PRIORITY_ORDER as option (option)}
				<Select.Item value={option} label={PRIORITY_META[option].label}>
					{PRIORITY_META[option].label}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root
		type="single"
		value={due}
		onValueChange={(value) => onpatch({ due: value as DueFilter })}
	>
		<Select.Trigger aria-label="Filter by due date">{DUE_LABELS[due]}</Select.Trigger>
		<Select.Content>
			{#each DUE_OPTIONS as option (option)}
				<Select.Item value={option} label={DUE_LABELS[option]}>{DUE_LABELS[option]}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root
		type="single"
		value={sort}
		onValueChange={(value) => onpatch({ sort: value as SortKey })}
	>
		<Select.Trigger aria-label="Sort tasks">
			{sort === 'due' ? 'Due date' : sort === 'priority' ? 'Priority' : 'Newest'}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="due" label="Due date">Due date</Select.Item>
			<Select.Item value="priority" label="Priority">Priority</Select.Item>
			<Select.Item value="newest" label="Newest">Newest</Select.Item>
		</Select.Content>
	</Select.Root>

	<Input
		bind:value={draft}
		oninput={onSearchInput}
		placeholder="Search tasks…"
		class="w-full sm:w-52"
		aria-label="Search tasks"
	/>

	<div class="flex-1"></div>

	<Button onclick={onnew}>
		<Plus class="size-4" />
		New task
	</Button>
</div>
