<script lang="ts">
	// Task list container: one bordered card, one TaskRow per task.
	import TaskRow from './TaskRow.svelte';
	import type { ProjectItem, TaskItem, TaskProgress } from './types.js';

	let {
		items,
		projects,
		showProject,
		today,
		progressOf,
		onopen,
		onstatuschange,
		ondelete
	}: {
		items: TaskItem[];
		projects: ProjectItem[];
		showProject: boolean;
		today: string;
		progressOf: (id: string) => TaskProgress;
		onopen: (task: TaskItem) => void;
		onstatuschange: (task: TaskItem, status: string) => void;
		ondelete: (task: TaskItem) => void;
	} = $props();

	function projectName(id: string): string {
		return projects.find((project) => project.id === id)?.name ?? '';
	}
</script>

<div
	class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
>
	{#each items as task (task.id)}
		<TaskRow
			{task}
			{today}
			progress={progressOf(task.id)}
			projectName={showProject ? projectName(task.projectId) : undefined}
			{onopen}
			{onstatuschange}
			{ondelete}
		/>
	{/each}
</div>
