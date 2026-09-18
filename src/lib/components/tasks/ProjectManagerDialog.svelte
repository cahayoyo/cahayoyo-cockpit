<script lang="ts">
	// Manage projects dialog: rename, add, delete with task counts. Inbox and
	// projects that still have tasks cannot be deleted (disabled with a reason).
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { submitAction } from '$lib/forms.js';
	import type { ProjectItem } from './types.js';

	let {
		open = $bindable(false),
		projects,
		onselect,
		ondeleted
	}: {
		open?: boolean;
		projects: ProjectItem[];
		onselect: (projectId: string) => void;
		ondeleted: (projectId: string) => void;
	} = $props();

	let draftName = $state('');
	let editingId = $state<string | null>(null);
	let editingName = $state('');
	let confirmOpen = $state(false);
	let deleteTarget = $state<ProjectItem | null>(null);

	function deleteReason(project: ProjectItem): string {
		if (project.isInbox) return 'Inbox cannot be deleted';
		if (project.taskCount > 0) return 'Project still has tasks';
		return 'Delete project';
	}

	async function create(): Promise<void> {
		const name = draftName.trim();
		if (name === '') return;

		const outcome = await submitAction('?/createProject', { name });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return;
		}

		draftName = '';
		toast.success('Project created');
		if (typeof outcome.data.projectId === 'string') onselect(outcome.data.projectId);
	}

	function startRename(project: ProjectItem): void {
		editingId = project.id;
		editingName = project.name;
	}

	async function commitRename(): Promise<void> {
		if (editingId === null || editingName.trim() === '') return;
		const id = editingId;
		editingId = null;

		const outcome = await submitAction('?/renameProject', { id, name: editingName.trim() });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return;
		}

		toast.success('Project renamed');
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Projects</Dialog.Title>
			<Dialog.Description>
				Rename, delete, or add projects. Inbox always exists; a project with tasks cannot be
				deleted.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-1">
			{#each projects as project (project.id)}
				{#if editingId === project.id}
					<form
						class="flex items-center gap-1"
						onsubmit={(event) => {
							event.preventDefault();
							void commitRename();
						}}
					>
						<Input bind:value={editingName} class="h-8" aria-label="Project name" />
						<Button size="sm" type="submit">Save</Button>
						<Button size="sm" variant="ghost" type="button" onclick={() => (editingId = null)}>
							Cancel
						</Button>
					</form>
				{:else}
					<div class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
						<span class="flex-1 truncate text-sm">{project.name}</span>
						<span class="text-xs text-muted-foreground">{project.taskCount}</span>
						<Button size="xs" variant="ghost" onclick={() => startRename(project)}>Rename</Button>
						<Button
							size="icon-sm"
							variant="ghost"
							class="shrink-0 max-lg:size-11"
							aria-label="Delete project"
							disabled={project.isInbox || project.taskCount > 0}
							title={deleteReason(project)}
							onclick={() => {
								deleteTarget = project;
								confirmOpen = true;
							}}
						>
							<Trash2 class="size-3.5" />
						</Button>
					</div>
				{/if}
			{/each}
		</div>

		<form
			class="flex items-center gap-2 border-t pt-3"
			onsubmit={(event) => {
				event.preventDefault();
				void create();
			}}
		>
			<Input bind:value={draftName} placeholder="New project name" aria-label="New project name" />
			<Button type="submit" variant="outline">
				<Plus class="size-4" />
				Add
			</Button>
		</form>

		<ConfirmDialog
			bind:open={confirmOpen}
			title="Delete project"
			description={deleteTarget ? `"${deleteTarget.name}" will be deleted permanently.` : ''}
			confirmLabel="Delete project"
			action="?/deleteProject"
			fields={{ id: deleteTarget?.id ?? '' }}
			successMessage="Project deleted"
			onsuccess={() => {
				if (deleteTarget) ondeleted(deleteTarget.id);
				deleteTarget = null;
			}}
		/>
	</Dialog.Content>
</Dialog.Root>
