<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import SearchX from '@lucide/svelte/icons/search-x';
	import type { Component } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { ROOT_FOLDER_ID } from '$lib/folders/tree.js';
	import { buildBookmarkSearch } from '$lib/bookmarks/params.js';
	import { folderIdsWithDescendants, type FolderRow } from '$lib/folders/tree.js';
	import BookmarkEditorDialog from '$lib/components/bookmarks/BookmarkEditorDialog.svelte';
	import BookmarkGrid from '$lib/components/bookmarks/BookmarkGrid.svelte';
	import BookmarkList from '$lib/components/bookmarks/BookmarkList.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import FolderSidebar from '$lib/components/bookmarks/FolderSidebar.svelte';
	import Toolbar from '$lib/components/bookmarks/Toolbar.svelte';
	import type { BookmarkItem, FilterPatch, ViewProps } from '$lib/components/bookmarks/types.js';
	import { submitAction } from '$lib/forms.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { PageProps } from './$types.js';
	import { toast } from 'svelte-sonner';

	const VIEWS: Record<string, Component<ViewProps>> = {
		grid: BookmarkGrid,
		list: BookmarkList
	};

	const SKELETON_KEYS = [0, 1, 2, 3, 4, 5];

	let { data }: PageProps = $props();

	let editorOpen = $state(false);
	let editing = $state<BookmarkItem | null>(null);
	let confirming = $state<
		| { kind: 'bookmark'; id: string; name: string }
		| { kind: 'folder'; id: string; name: string; ids: Set<string> }
		| null
	>(null);
	let confirmOpen = $state(false);

	const activeView = $derived(VIEWS[data.view] ?? BookmarkGrid);
	// `navigating.to` is set for URL changes only (null on the server, and for form
	// submissions/invalidations), so mutations do not flash the skeleton.
	const loading = $derived(navigating.to !== null);
	// As long as no filter narrows the list, the selected folder also shows its subfolders.
	const browsing = $derived(
		data.filters.q.trim().length === 0 && !data.filters.favorite && data.filters.tag === null
	);
	const childFolders = $derived(
		browsing
			? data.folders.filter(
					(folder) =>
						folder.parentId ===
						(data.filters.folderId === ROOT_FOLDER_ID ? null : data.filters.folderId)
				)
			: []
	);
	const emptyMessage = $derived(
		data.filters.q.trim().length > 0 || data.filters.favorite || data.filters.tag !== null
			? 'No bookmarks match these filters.'
			: 'No bookmarks in this folder.'
	);

	function applyFilters(patch: FilterPatch): void {
		// Omitted keys keep their current value; `null` clears the filter.
		const query = buildBookmarkSearch(
			{
				q: patch.q ?? data.filters.q,
				favorite: patch.favorite ?? data.filters.favorite,
				tag: patch.tag === undefined ? data.filters.tag : patch.tag,
				sort: patch.sort ?? data.filters.sort,
				folderId:
					patch.folder === undefined ? data.filters.folderId : (patch.folder ?? ROOT_FOLDER_ID)
			},
			patch.view ?? data.view
		);
		const path = query ? resolve(`/bookmarks?${query}`) : resolve('/bookmarks');
		void goto(path, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
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

	function openCreate(): void {
		editing = null;
		editorOpen = true;
	}

	function openEdit(bookmark: BookmarkItem): void {
		editing = bookmark;
		editorOpen = true;
	}

	function askDeleteBookmark(bookmark: BookmarkItem): void {
		confirming = { kind: 'bookmark', id: bookmark.id, name: bookmark.title };
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
		if (!target || target.kind !== 'folder') return;

		// The deleted subtree may be the folder the URL points at; move back to the root.
		const selected = page.url.searchParams.get('folder');
		if (selected && target.ids.has(selected)) applyFilters({ folder: null });
	}

	function clearFilters(): void {
		applyFilters({ q: '', favorite: false, tag: null });
	}
</script>

<Toolbar
	q={data.filters.q}
	favorite={data.filters.favorite}
	tag={data.filters.tag}
	sort={data.filters.sort}
	folder={data.filters.folderId}
	view={data.view}
	tags={data.tags}
	count={data.items.length}
	onfilter={applyFilters}
	onview={(view) => applyFilters({ view })}
	onreset={() => applyFilters({ q: '', favorite: false, tag: null, sort: 'newest', folder: null })}
	onnew={openCreate}
/>

<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
	<FolderSidebar
		folders={data.folders}
		folder={data.filters.folderId}
		onselect={(folder) => applyFilters({ folder })}
		ondelete={askDeleteFolder}
	/>

	<div class="min-w-0 flex-1 space-y-4">
		{#if childFolders.length > 0}
			<ul
				class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
			>
				{#each childFolders as folder (folder.id)}
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-accent/50"
							onclick={() => applyFilters({ folder: folder.id })}
						>
							<FolderIcon class="size-4 shrink-0 text-muted-foreground" />
							<span class="min-w-0 flex-1 truncate font-medium">{folder.name}</span>
							<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if loading}
			<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" aria-busy="true">
				{#each SKELETON_KEYS as key (key)}
					<Skeleton class="aspect-square rounded-xl" />
				{/each}
			</div>
		{:else if data.items.length === 0}
			<div
				class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
			>
				<SearchX class="size-6 text-muted-foreground" />
				<p class="text-sm text-muted-foreground">{emptyMessage}</p>
				{#if data.filters.q.trim() || data.filters.favorite || data.filters.tag !== null}
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				{/if}
			</div>
		{:else}
			{@const ActiveView = activeView}
			<ActiveView items={data.items} onedit={openEdit} ondelete={askDeleteBookmark} />
		{/if}
	</div>
</div>

<BookmarkEditorDialog
	bind:open={editorOpen}
	bookmark={editing}
	media={data.media}
	folders={data.folders}
	tags={data.tags}
	oncreate={createFolder}
/>

<ConfirmDialog
	bind:open={confirmOpen}
	title={confirming?.kind === 'folder' ? 'Delete folder' : 'Delete bookmark'}
	description={confirming?.kind === 'folder'
		? `"${confirming.name}" and its subfolders will be deleted. Their bookmarks move to Bookmarks bar.`
		: confirming
			? `"${confirming.name}" will be removed from your bookmarks.`
			: ''}
	confirmLabel={confirming?.kind === 'folder' ? 'Delete folder' : 'Delete bookmark'}
	action={confirming?.kind === 'folder' ? '?/deleteFolder' : '?/deleteBookmark'}
	fields={confirming ? { id: confirming.id } : {}}
	successMessage={confirming?.kind === 'folder' ? 'Folder deleted' : 'Bookmark deleted'}
	onsuccess={afterConfirm}
/>
