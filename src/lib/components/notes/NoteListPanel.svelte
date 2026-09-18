<script lang="ts">
	// Note list panel doubling as the folder browser: breadcrumb, subfolder drill-down,
	// inline New folder / Rename, per-folder kebab (New subfolder / Rename / Delete) and
	// per-note kebab (Pin/Unpin / Delete). Search is debounced and lives in the URL.
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderPlus from '@lucide/svelte/icons/folder-plus';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Pin from '@lucide/svelte/icons/pin';
	import PinOff from '@lucide/svelte/icons/pin-off';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import SearchX from '@lucide/svelte/icons/search-x';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { onDestroy } from 'svelte';
	import { ROOT_FOLDER_ID, type FolderRow } from '$lib/folders/tree.js';
	import { formatDateTime } from '$lib/notes/format.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils.js';
	import type { NoteItem } from './types.js';

	let {
		items,
		activeId,
		q,
		childFolders,
		breadcrumb,
		loading,
		onSearch,
		onSelect,
		onOpenFolder,
		onCreate,
		onTogglePin,
		onDelete,
		onCreateFolder,
		onRenameFolder,
		onDeleteFolder
	}: {
		items: NoteItem[];
		activeId: string | null;
		q: string;
		childFolders: FolderRow[];
		breadcrumb: FolderRow[];
		loading: boolean;
		onSearch: (q: string) => void;
		onSelect: (id: string) => void;
		onOpenFolder: (id: string) => void;
		onCreate: () => void;
		onTogglePin: (note: NoteItem) => void;
		onDelete: (note: NoteItem) => void;
		onCreateFolder: (name: string) => Promise<void>;
		onRenameFolder: (id: string, name: string) => Promise<void>;
		onDeleteFolder: (folder: FolderRow) => void;
	} = $props();

	const SKELETON_KEYS = [0, 1, 2, 3, 4];

	let draft = $state('');
	let emitted = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (q === emitted) return;
		// The URL changed from somewhere else (clear, back button): drop the pending
		// keystroke so it cannot overwrite that change.
		clearTimeout(timer);
		draft = q;
		emitted = q;
	});

	function onInput(): void {
		clearTimeout(timer);
		timer = setTimeout(() => {
			emitted = draft;
			onSearch(draft);
		}, 300);
	}

	function clearSearch(): void {
		clearTimeout(timer);
		draft = '';
		emitted = '';
		onSearch('');
	}

	onDestroy(() => clearTimeout(timer));

	let creating = $state(false);
	let creatingDraft = $state('');
	let renamingId = $state<string | null>(null);
	let renamingDraft = $state('');

	function startCreating(): void {
		renamingId = null;
		creatingDraft = '';
		creating = true;
	}

	async function commitCreate(): Promise<void> {
		if (!creating) return;
		const name = creatingDraft.trim();
		creating = false;
		if (name) await onCreateFolder(name);
	}

	function startRename(folder: FolderRow): void {
		creating = false;
		renamingDraft = folder.name;
		renamingId = folder.id;
	}

	async function commitRename(): Promise<void> {
		const id = renamingId;
		renamingId = null;
		const name = renamingDraft.trim();
		if (id && name) await onRenameFolder(id, name);
	}

	function onNameKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			event.preventDefault();
			void commitCreate();
			void commitRename();
		} else if (event.key === 'Escape') {
			creating = false;
			renamingId = null;
		}
	}

	function newSubfolder(folder: FolderRow): void {
		onOpenFolder(folder.id);
		startCreating();
	}

	const emptyMessage = $derived(
		q.trim() !== ''
			? 'No notes match your search'
			: breadcrumb.length === 0
				? 'No notes yet'
				: 'This folder is empty'
	);
</script>

<section
	class="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
>
	<div class="flex items-center gap-2 border-b border-border p-2">
		<div class="relative min-w-0 flex-1">
			<Search
				class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				class="pl-8 max-lg:h-11"
				placeholder="Search notes"
				aria-label="Search notes"
				bind:value={draft}
				oninput={onInput}
			/>
		</div>
		<Button
			variant="outline"
			size="icon-sm"
			class="shrink-0 max-lg:size-11"
			aria-label="New folder"
			title="New folder"
			onclick={startCreating}
		>
			<FolderPlus class="size-4" />
		</Button>
		<Button size="sm" class="shrink-0 gap-1.5 max-sm:h-11" onclick={onCreate}>
			<Plus class="size-4" /> New note
		</Button>
	</div>

	<nav
		class="flex min-w-0 items-center gap-0.5 border-b border-border px-2.5 py-1.5 text-xs text-muted-foreground"
		aria-label="Folder path"
	>
		<button
			type="button"
			class={cn(
				'shrink-0 rounded px-0.5 transition-colors hover:text-foreground max-lg:min-h-11 max-lg:px-2',
				breadcrumb.length === 0 && 'font-medium text-foreground'
			)}
			onclick={() => onOpenFolder(ROOT_FOLDER_ID)}
		>
			Notes
		</button>
		{#each breadcrumb as crumb, index (crumb.id)}
			<ChevronRight class="size-3 shrink-0" />
			<button
				type="button"
				class={cn(
					'truncate rounded px-0.5 transition-colors hover:text-foreground max-lg:min-h-11 max-lg:px-2',
					index === breadcrumb.length - 1 && 'font-medium text-foreground'
				)}
				onclick={() => onOpenFolder(crumb.id)}
			>
				{crumb.name}
			</button>
		{/each}
	</nav>

	<div class="min-h-0 flex-1 overflow-y-auto p-1.5">
		{#if childFolders.length > 0 || creating}
			<ul class="mb-1.5 space-y-1">
				{#each childFolders as child (child.id)}
					<li
						class={cn(
							'group/row flex items-center rounded-lg transition-colors',
							renamingId !== child.id && 'hover:bg-accent/50'
						)}
					>
						{#if renamingId === child.id}
							<Input
								autofocus
								bind:value={renamingDraft}
								class="my-0.5 mr-1 ml-1 h-7 min-w-0 flex-1 rounded-md px-2 text-sm max-lg:h-11"
								aria-label={`Rename ${child.name}`}
								onkeydown={onNameKeydown}
								onblur={commitRename}
							/>
						{:else}
							<button
								type="button"
								class="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left max-lg:min-h-11"
								onclick={() => onOpenFolder(child.id)}
							>
								<FolderIcon class="size-4 shrink-0 text-muted-foreground" />
								<span class="min-w-0 flex-1 truncate text-sm font-medium">{child.name}</span>
								<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
							</button>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									type="button"
									class="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-lg:size-11 max-lg:opacity-100"
									aria-label={`Folder actions for ${child.name}`}
								>
									<MoreHorizontal class="size-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Content class="w-44" align="end">
									<DropdownMenu.Item class="gap-2" onSelect={() => newSubfolder(child)}>
										<FolderPlus class="size-4" />
										New subfolder
									</DropdownMenu.Item>
									<DropdownMenu.Item class="gap-2" onSelect={() => startRename(child)}>
										<Pencil class="size-4" />
										Rename
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item
										class="gap-2"
										variant="destructive"
										onSelect={() => onDeleteFolder(child)}
									>
										<Trash2 class="size-4" />
										Delete
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						{/if}
					</li>
				{/each}
				{#if creating}
					<li>
						<Input
							autofocus
							bind:value={creatingDraft}
							placeholder="New folder"
							class="my-0.5 h-7 w-full min-w-0 rounded-md px-2 text-sm max-lg:h-11"
							aria-label="New folder name"
							onkeydown={onNameKeydown}
							onblur={commitCreate}
						/>
					</li>
				{/if}
			</ul>
		{/if}

		{#if loading}
			<div class="space-y-1" aria-busy="true">
				{#each SKELETON_KEYS as key (key)}
					<Skeleton class="h-16 rounded-lg" />
				{/each}
			</div>
		{:else if items.length > 0}
			<ul class="space-y-1">
				{#each items as note (note.id)}
					<li
						class={cn(
							'group/row flex items-center rounded-lg transition-colors hover:bg-accent',
							note.id === activeId && 'bg-accent'
						)}
					>
						<button
							type="button"
							class="min-w-0 flex-1 px-2.5 py-2 text-left max-lg:min-h-11"
							onclick={() => onSelect(note.id)}
						>
							<div class="flex items-center gap-1.5">
								{#if note.pinned}
									<Pin class="size-3 shrink-0 text-muted-foreground" />
								{/if}
								<span class="truncate text-sm font-medium">{note.title || 'Untitled'}</span>
							</div>
							<p class="truncate text-xs text-muted-foreground">
								{note.snippet || 'Empty note'}
							</p>
							<p class="text-xs text-muted-foreground tabular-nums">
								{formatDateTime(note.updatedAt)}
							</p>
						</button>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								type="button"
								class="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-lg:size-11 max-lg:opacity-100"
								aria-label={`Note actions for ${note.title || 'Untitled'}`}
							>
								<MoreHorizontal class="size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-44" align="end">
								<DropdownMenu.Item class="gap-2" onSelect={() => onTogglePin(note)}>
									{#if note.pinned}
										<PinOff class="size-4" />
										Unpin
									{:else}
										<Pin class="size-4" />
										Pin
									{/if}
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									class="gap-2"
									variant="destructive"
									onSelect={() => onDelete(note)}
								>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="flex h-full min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
				{#if q.trim() !== ''}
					<SearchX class="size-6 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">{emptyMessage}</p>
					<Button variant="outline" size="sm" class="max-lg:h-11" onclick={clearSearch}
						>Clear</Button
					>
				{:else}
					<NotebookPen class="size-6 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">{emptyMessage}</p>
					<Button size="sm" class="gap-1.5 max-lg:h-11" onclick={onCreate}>
						<Plus class="size-4" /> New note
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</section>
