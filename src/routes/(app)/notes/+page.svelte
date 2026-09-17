<script lang="ts">
	// Notes page: two columns — the note list panel doubles as the folder browser
	// (breadcrumb, drill-down, folder CRUD) beside the editor pane. Selection, search,
	// and the browsed folder live in the URL (`?note=`, `?q=`, `?folder=`); the narrow
	// layout swaps to full-screen list / full-screen editor driven by `?note=`.
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import NoteEditor from '$lib/components/notes/NoteEditor.svelte';
	import NoteListPanel from '$lib/components/notes/NoteListPanel.svelte';
	import type { NoteItem } from '$lib/components/notes/types.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		folderIdsWithDescendants,
		folderPath,
		ROOT_FOLDER_ID,
		type FolderRow
	} from '$lib/folders/tree.js';
	import { submitAction } from '$lib/forms.js';
	import { buildNoteSearch } from '$lib/notes/params.js';
	import { cn } from '$lib/utils.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	let focusTitleAt = $state(0);
	let confirmOpen = $state(false);
	let confirming = $state<
		| { kind: 'note'; id: string; title: string; nextId: string | null | undefined }
		| { kind: 'folder'; id: string; name: string; ids: Set<string> }
		| null
	>(null);

	const q = $derived(data.q);
	// A folder that no longer exists (stale link) degrades to the root.
	const folderId = $derived.by(() => {
		const raw = page.url.searchParams.get('folder') ?? '';
		return data.folders.some((folder) => folder.id === raw) ? raw : ROOT_FOLDER_ID;
	});
	const activeNote = $derived(data.activeNote);
	const scopeId = $derived(folderId === ROOT_FOLDER_ID ? null : folderId);
	const searching = $derived(q.trim() !== '');
	// Search results are already global; otherwise the list shows the direct contents
	// of the browsed folder.
	const visible = $derived(
		searching ? data.notes : data.notes.filter((item) => item.folderId === scopeId)
	);
	const childFolders = $derived(
		searching ? [] : data.folders.filter((folder) => folder.parentId === scopeId)
	);
	const breadcrumb = $derived(folderPath(data.folders, folderId));
	// A URL change that refetches the notes (a new search) shows skeletons; note and
	// folder changes reuse the loaded data, so they switch instantly.
	const loading = $derived(
		navigating.to !== null && navigating.to.url.searchParams.get('q') !== data.q
	);
	const editorLoading = $derived(
		navigating.to !== null &&
			activeNote === null &&
			(navigating.to.url.searchParams.get('note') ?? '') !== ''
	);

	function applyParams(patch: { q?: string; folderId?: string; noteId?: string | null }): void {
		const query = buildNoteSearch({
			q: patch.q ?? q,
			folderId: patch.folderId ?? folderId,
			noteId: patch.noteId === undefined ? (activeNote?.id ?? null) : patch.noteId
		});
		void goto(resolve(query ? `/notes?${query}` : '/notes'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	async function createNote(): Promise<void> {
		const outcome = await submitAction('?/createNote', { folderId: scopeId ?? '' });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return;
		}

		const noteId = outcome.data.noteId;
		if (typeof noteId !== 'string') {
			toast.error('The note could not be created.');
			return;
		}

		focusTitleAt += 1;
		applyParams({ noteId });
	}

	async function createFolder(parentId: string | null, name: string): Promise<string | null> {
		const outcome = await submitAction('?/createFolder', { name, parentId: parentId ?? '' });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return null;
		}

		toast.success('Folder created');
		return typeof outcome.data.folderId === 'string' ? outcome.data.folderId : null;
	}

	async function createFolderHere(name: string): Promise<void> {
		await createFolder(scopeId, name);
	}

	async function renameFolder(id: string, name: string): Promise<void> {
		const outcome = await submitAction('?/renameFolder', { id, name });
		if (outcome.ok) {
			toast.success('Folder renamed');
		} else {
			toast.error(outcome.message);
		}
	}

	async function togglePin(note: NoteItem): Promise<void> {
		const outcome = await submitAction('?/togglePin', {
			id: note.id,
			pinned: String(!note.pinned)
		});
		if (!outcome.ok) {
			toast.error(outcome.message);
		}
	}

	function askDeleteNote(note: NoteItem): void {
		// After a delete the selection moves to the next note in list order — but only
		// when the deleted note was the selected one.
		const order = visible;
		const index = order.findIndex((item) => item.id === note.id);
		const next = order[index + 1] ?? order[index - 1] ?? null;
		confirming = {
			kind: 'note',
			id: note.id,
			title: note.title || 'Untitled',
			nextId: activeNote?.id === note.id ? (next?.id ?? null) : undefined
		};
		confirmOpen = true;
	}

	function askDeleteFolder(folder: FolderRow): void {
		confirming = {
			kind: 'folder',
			id: folder.id,
			name: folder.name,
			ids: folderIdsWithDescendants(data.folders, folder.id)
		};
		confirmOpen = true;
	}

	function afterConfirm(): void {
		const target = confirming;
		if (!target) return;

		if (target.kind === 'note') {
			if (target.nextId !== undefined) applyParams({ noteId: target.nextId });
			return;
		}

		// The deleted subtree may be the folder being browsed; move back to the root.
		if (target.ids.has(folderId)) {
			applyParams({ folderId: ROOT_FOLDER_ID, noteId: null });
		}
	}
</script>

<div class="app-pane flex min-h-96 flex-col gap-4 lg:flex-row lg:items-stretch">
	<div
		class={cn(
			'min-h-0 min-w-0 flex-1 lg:w-80 lg:flex-none',
			activeNote ? 'hidden lg:flex' : 'flex'
		)}
	>
		<NoteListPanel
			items={visible}
			activeId={activeNote?.id ?? null}
			{q}
			{childFolders}
			{breadcrumb}
			{loading}
			onSearch={(value) => applyParams({ q: value })}
			onSelect={(id) => applyParams({ noteId: id })}
			onOpenFolder={(id) => applyParams({ folderId: id, noteId: null })}
			onCreate={() => void createNote()}
			onTogglePin={(note) => void togglePin(note)}
			onDelete={askDeleteNote}
			onCreateFolder={createFolderHere}
			onRenameFolder={renameFolder}
			onDeleteFolder={askDeleteFolder}
		/>
	</div>

	<section
		class={cn(
			'min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card',
			activeNote ? 'flex' : 'hidden lg:flex'
		)}
	>
		{#if editorLoading}
			<div class="flex flex-1 flex-col" aria-busy="true">
				<div class="flex items-center gap-2 border-b border-border px-4 py-2.5">
					<Skeleton class="h-7 w-56" />
					<div class="flex-1"></div>
					<Skeleton class="h-7 w-16" />
				</div>
				<div class="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
					<Skeleton class="h-7 w-44" />
					<Skeleton class="h-7 w-44" />
				</div>
				<div class="flex-1 space-y-3 p-4">
					<Skeleton class="h-4 w-3/4" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-5/6" />
					<Skeleton class="h-4 w-2/3" />
				</div>
			</div>
		{:else if activeNote}
			<NoteEditor
				note={activeNote}
				folders={data.folders}
				tagSuggestions={data.tags}
				{focusTitleAt}
				onFocusHandled={() => (focusTitleAt = 0)}
				onTogglePin={(note) => void togglePin(note)}
				onDelete={askDeleteNote}
				onBack={() => applyParams({ noteId: null })}
				onCreateFolder={createFolder}
			/>
		{:else}
			<div class="grid flex-1 place-items-center p-6 text-sm text-muted-foreground">
				Select a note or create a new one
			</div>
		{/if}
	</section>
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={confirming?.kind === 'folder' ? 'Delete folder' : 'Delete note'}
	description={confirming?.kind === 'folder'
		? `"${confirming.name}" and its subfolders will be deleted. Notes inside become unfiled.`
		: confirming
			? `"${confirming.title}" will be deleted permanently.`
			: ''}
	confirmLabel={confirming?.kind === 'folder' ? 'Delete folder' : 'Delete note'}
	action={confirming?.kind === 'folder' ? '?/deleteFolder' : '?/deleteNote'}
	fields={confirming ? { id: confirming.id } : {}}
	successMessage={confirming?.kind === 'folder' ? 'Folder deleted' : 'Note deleted'}
	onsuccess={afterConfirm}
/>
