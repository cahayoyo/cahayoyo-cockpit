<script lang="ts">
	// Task detail dialog: create (empty title focused) and edit. Title,
	// description, priority, due date and tags save via the form; status and
	// project change immediately (status is server-owned, project move is its own
	// action); subtasks are managed inline. Deep-linked via `?task=` on /tasks.
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import MarkdownPreview from '$lib/components/notes/MarkdownPreview.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { failureMessage, submitAction } from '$lib/forms.js';
	import {
		deleteTaskDescription,
		PRIORITY_META,
		PRIORITY_ORDER,
		STATUS_META,
		STATUS_ORDER,
		type TaskPriority,
		type TaskStatus
	} from '$lib/tasks/presentation.js';
	import { cn } from '$lib/utils.js';
	import type { ProjectItem, TaskItem } from './types.js';

	let {
		open,
		task = null,
		subtasks,
		projects,
		tags,
		defaultProjectId,
		onclose
	}: {
		open: boolean;
		task?: TaskItem | null;
		subtasks: TaskItem[];
		projects: ProjectItem[];
		tags: string[];
		defaultProjectId: string;
		onclose: () => void;
	} = $props();

	type Draft = {
		title: string;
		description: string;
		projectId: string;
		priority: TaskPriority;
		dueDate: string;
		tagsText: string;
	};

	let draft = $state<Draft>({
		title: '',
		description: '',
		projectId: '',
		priority: 'medium',
		dueDate: '',
		tagsText: ''
	});
	let pane = $state<'write' | 'preview'>('write');
	let subtaskDraft = $state('');
	let error = $state('');
	let saving = $state(false);
	let titleInput = $state<HTMLInputElement | null>(null);
	let confirmOpen = $state(false);
	let deleteTarget = $state<TaskItem | null>(null);
	let syncedKey = $state<string | null>(null);
	// The task the dialog is showing, remembered so the delete confirm can tell
	// "deleted the open task" (close the parent, strip ?task=) from "deleted a
	// subtask" — after the confirm's `update()` the task prop is already null.
	let openTaskId = $state<string | null>(null);

	const doneCount = $derived(subtasks.filter((subtask) => subtask.status === 'done').length);
	const canSave = $derived(draft.title.trim().length > 0 && !saving);

	// Reset the draft when the dialog opens (or switches task) — not on every
	// server refresh, so an invalidation never wipes unsaved edits.
	$effect(() => {
		const key = open ? (task?.id ?? 'new') : null;
		if (key === syncedKey) return;
		syncedKey = key;
		if (key === null) return;
		openTaskId = key === 'new' ? null : key;

		draft = task
			? {
					title: task.title,
					description: task.description ?? '',
					projectId: task.projectId,
					priority: task.priority,
					dueDate: task.dueDate ?? '',
					tagsText: task.tags.join(', ')
				}
			: {
					title: '',
					description: '',
					projectId: defaultProjectId,
					priority: 'medium',
					dueDate: '',
					tagsText: ''
				};
		pane = 'write';
		subtaskDraft = '';
		error = '';
		if (key === 'new') titleInput?.focus();
	});

	async function changeStatus(status: TaskStatus): Promise<void> {
		if (!task || task.status === status) return;
		const outcome = await submitAction('?/setTaskStatus', { id: task.id, status });
		if (!outcome.ok) toast.error(outcome.message);
	}

	async function changeProject(projectId: string): Promise<void> {
		const previous = draft.projectId;
		draft.projectId = projectId;
		if (!task || task.projectId === projectId) return;

		const outcome = await submitAction('?/moveTaskProject', { id: task.id, projectId });
		if (!outcome.ok) {
			draft.projectId = previous;
			toast.error(outcome.message);
		}
	}

	async function addSubtask(): Promise<void> {
		const title = subtaskDraft.trim();
		if (!task || title === '') return;

		const outcome = await submitAction('?/saveTask', {
			id: '',
			title,
			description: '',
			projectId: task.projectId,
			priority: 'medium',
			dueDate: '',
			parentId: task.id,
			tags: ''
		});
		if (!outcome.ok) {
			toast.error(outcome.message);
			return;
		}

		subtaskDraft = '';
	}

	async function toggleSubtask(subtask: TaskItem, done: boolean): Promise<void> {
		const outcome = await submitAction('?/setTaskStatus', {
			id: subtask.id,
			status: done ? 'done' : 'backlog'
		});
		if (!outcome.ok) toast.error(outcome.message);
	}

	function requestDelete(target: TaskItem): void {
		deleteTarget = target;
		confirmOpen = true;
	}

	function afterDelete(): void {
		if (deleteTarget && deleteTarget.id === openTaskId) onclose();
		deleteTarget = null;
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(value) => {
		if (!value) onclose();
	}}
>
	<Dialog.Content class="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="sr-only">{task ? 'Task detail' : 'New task'}</Dialog.Title>
			<Dialog.Description class="sr-only">
				{task ? 'Edit this task and its subtasks.' : 'Create a task.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/saveTask"
			use:enhance={() => {
				saving = true;
				return async ({ result, update }) => {
					saving = false;
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					toast.success(task ? 'Task updated' : 'Task created');
					onclose();
				};
			}}
		>
			<input type="hidden" name="id" value={task?.id ?? ''} />
			<input type="hidden" name="parentId" value={task?.parentId ?? ''} />
			<input type="hidden" name="projectId" value={draft.projectId} />
			<input type="hidden" name="priority" value={draft.priority} />
			<input type="hidden" name="description" value={draft.description} />

			<div class="space-y-1">
				<Label for="task-title">Title</Label>
				<Input
					id="task-title"
					bind:ref={titleInput}
					name="title"
					bind:value={draft.title}
					placeholder="Fix flaky login test"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="space-y-1">
					<Label for="task-project">Project</Label>
					<Select.Root
						type="single"
						value={draft.projectId}
						disabled={task === null}
						onValueChange={(value) => void changeProject(value)}
					>
						<Select.Trigger id="task-project" class="w-full" aria-label="Project">
							{projects.find((project) => project.id === draft.projectId)?.name ?? 'Project'}
						</Select.Trigger>
						<Select.Content>
							{#each projects as project (project.id)}
								<Select.Item value={project.id} label={project.name}>{project.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				{#if task}
					<div class="space-y-1">
						<Label for="task-status">Status</Label>
						<Select.Root
							type="single"
							value={task.status}
							onValueChange={(value) => void changeStatus(value as TaskStatus)}
						>
							<Select.Trigger id="task-status" class="w-full" aria-label="Status">
								{STATUS_META[task.status].label}
							</Select.Trigger>
							<Select.Content>
								{#each STATUS_ORDER as option (option)}
									<Select.Item value={option} label={STATUS_META[option].label}>
										{STATUS_META[option].label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				{/if}

				<div class="space-y-1">
					<Label for="task-priority">Priority</Label>
					<Select.Root
						type="single"
						value={draft.priority}
						onValueChange={(value) => (draft.priority = value as TaskPriority)}
					>
						<Select.Trigger id="task-priority" class="w-full" aria-label="Priority">
							{PRIORITY_META[draft.priority].label}
						</Select.Trigger>
						<Select.Content>
							{#each PRIORITY_ORDER as option (option)}
								<Select.Item value={option} label={PRIORITY_META[option].label}>
									{PRIORITY_META[option].label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-1">
					<Label for="task-due">Due date</Label>
					<Input id="task-due" type="date" name="dueDate" bind:value={draft.dueDate} />
				</div>
			</div>

			<div class="space-y-1">
				<Label for="task-tags">Tags (comma separated)</Label>
				<Input
					id="task-tags"
					name="tags"
					bind:value={draft.tagsText}
					list="task-tags"
					placeholder="qa, frontend"
				/>
				<datalist id="task-tags">
					{#each tags as tag (tag)}
						<option value={tag}></option>
					{/each}
				</datalist>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-xs text-muted-foreground">Description (markdown)</span>
					<div class="flex items-center gap-1 rounded-lg border p-0.5">
						<Button
							type="button"
							variant={pane === 'write' ? 'secondary' : 'ghost'}
							size="xs"
							aria-pressed={pane === 'write'}
							onclick={() => (pane = 'write')}
						>
							Write
						</Button>
						<Button
							type="button"
							variant={pane === 'preview' ? 'secondary' : 'ghost'}
							size="xs"
							aria-pressed={pane === 'preview'}
							onclick={() => (pane = 'preview')}
						>
							Preview
						</Button>
					</div>
				</div>
				{#if pane === 'write'}
					<Textarea bind:value={draft.description} rows={5} placeholder="Add details…" />
				{:else}
					<div class="min-h-24 rounded-lg border p-3">
						{#if draft.description.trim() === ''}
							<p class="text-sm text-muted-foreground">Nothing to preview.</p>
						{:else}
							<MarkdownPreview body={draft.description} />
						{/if}
					</div>
				{/if}
			</div>

			{#if task && task.parentId === null}
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-xs text-muted-foreground">Subtasks</span>
						<span class="text-xs text-muted-foreground">{doneCount}/{subtasks.length}</span>
					</div>
					{#each subtasks as subtask (subtask.id)}
						<div class="flex items-center gap-2 rounded-lg border px-2 py-1.5">
							<label class="flex min-w-0 flex-1 items-center gap-2 max-lg:min-h-11">
								<input
									type="checkbox"
									class="size-4 accent-primary"
									checked={subtask.status === 'done'}
									onchange={(event) => void toggleSubtask(subtask, event.currentTarget.checked)}
								/>
								<span
									class={cn(
										'flex-1 truncate text-sm',
										subtask.status === 'done' && 'text-muted-foreground line-through'
									)}
								>
									{subtask.title || 'Untitled'}
								</span>
							</label>
							<Button
								variant="ghost"
								size="icon-sm"
								class="shrink-0 max-lg:size-11"
								aria-label="Delete subtask"
								onclick={() => requestDelete(subtask)}
							>
								<X class="size-3.5" />
							</Button>
						</div>
					{/each}
					<div class="flex items-center gap-2">
						<Input
							bind:value={subtaskDraft}
							placeholder="Add a subtask…"
							aria-label="New subtask"
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void addSubtask();
								}
							}}
						/>
						<Button type="button" variant="outline" onclick={() => void addSubtask()}>
							<Plus class="size-4" />
							Add
						</Button>
					</div>
				</div>
			{/if}

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Dialog.Footer class="justify-between sm:justify-between">
				{#if task}
					<Button type="button" variant="destructive" onclick={() => requestDelete(task)}>
						<Trash2 class="size-4" />
						Delete
					</Button>
				{:else}
					<span></span>
				{/if}
				<div class="flex items-center gap-2">
					<Button type="button" variant="outline" onclick={onclose}>Cancel</Button>
					<Button type="submit" disabled={!canSave}>
						{task ? 'Save' : 'Create task'}
					</Button>
				</div>
			</Dialog.Footer>
		</form>

		<ConfirmDialog
			bind:open={confirmOpen}
			title="Delete task"
			description={deleteTarget ? deleteTaskDescription(deleteTarget) : ''}
			confirmLabel="Delete task"
			action="?/deleteTask"
			fields={{ id: deleteTarget?.id ?? '' }}
			successMessage="Task deleted"
			onsuccess={afterDelete}
		/>
	</Dialog.Content>
</Dialog.Root>
