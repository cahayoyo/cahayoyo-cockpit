<script lang="ts">
	// Folder sidebar: virtual root ("Bookmarks bar", collapsed at load) over the shared
	// folder tree. Per-node chevron toggles children; selecting a folder auto-expands its
	// ancestors; hovering a row reveals New subfolder / Rename / Delete. Inline inputs
	// commit on Enter or blur (Enter/Escape/commit semantics from the prototype).
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderPlus from '@lucide/svelte/icons/folder-plus';
	import Library from '@lucide/svelte/icons/library';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { SvelteSet } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import {
		ancestorIds,
		buildFolderTree,
		ROOT_FOLDER_ID,
		type FolderNode,
		type FolderRow
	} from '$lib/folders/tree.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { cn } from '$lib/utils.js';
	import { submitAction } from '$lib/forms.js';

	let {
		folders,
		folder,
		onselect,
		ondelete
	}: {
		folders: FolderRow[];
		folder: string;
		onselect: (id: string) => void;
		ondelete: (folder: FolderRow) => void;
	} = $props();

	const tree = $derived(buildFolderTree(folders));
	const rootNode: FolderNode = {
		id: ROOT_FOLDER_ID,
		name: 'Bookmarks bar',
		parentId: null,
		children: []
	};

	let expanded = new SvelteSet<string>();
	let editing = $state<{ parentId: string; id: string | null } | null>(null);
	let draft = $state('');

	$effect(() => {
		if (folder === ROOT_FOLDER_ID) return;
		for (const id of ancestorIds(folders, folder)) expanded.add(id);
	});

	function childrenOf(node: FolderNode): FolderNode[] {
		return node.id === ROOT_FOLDER_ID ? tree : node.children;
	}

	function toggle(id: string): void {
		if (expanded.has(id)) expanded.delete(id);
		else expanded.add(id);
	}

	function startCreate(parentId: string): void {
		// The create input renders inside the node's children list, so the parent
		// (including the root) must be open for it to be reachable.
		expanded.add(parentId);
		draft = '';
		editing = { parentId, id: null };
	}

	function startRename(row: FolderRow): void {
		draft = row.name;
		editing = { parentId: ROOT_FOLDER_ID, id: row.id };
	}

	async function commit(): Promise<void> {
		const target = editing;
		if (!target) return;
		editing = null;

		const name = draft.trim();
		if (!name) return;

		const outcome = target.id
			? await submitAction('?/renameFolder', { id: target.id, name })
			: await submitAction('?/createFolder', {
					name,
					parentId: target.parentId === ROOT_FOLDER_ID ? '' : target.parentId
				});

		if (outcome.ok) {
			toast.success(target.id ? 'Folder renamed' : 'Folder created');
		} else {
			toast.error(outcome.message);
		}
	}

	function onEditKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			event.preventDefault();
			void commit();
		} else if (event.key === 'Escape') {
			editing = null;
		}
	}
</script>

<nav class="w-full shrink-0 lg:w-56" aria-label="Folders">
	<div class="flex items-center justify-between pr-1 pl-2.5">
		<span class="text-xs font-medium text-muted-foreground">Folders</span>
		<button
			type="button"
			class="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground max-lg:size-11"
			aria-label="New folder"
			title="New folder"
			onclick={() => startCreate(ROOT_FOLDER_ID)}
		>
			<Plus class="size-4" />
		</button>
	</div>

	<ul class="space-y-0.5">
		{#snippet node(item: FolderNode)}
			{@const kids = childrenOf(item)}
			{@const isOpen = expanded.has(item.id)}
			{@const isRoot = item.id === ROOT_FOLDER_ID}
			<li>
				<div
					class={cn(
						'group/row flex items-center rounded-md transition-colors',
						folder === item.id
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
					)}
				>
					{#if kids.length > 0}
						<button
							type="button"
							class="ml-1 grid size-6 shrink-0 place-items-center rounded-sm max-lg:size-11"
							aria-expanded={isOpen}
							aria-label={isOpen ? `Collapse ${item.name}` : `Expand ${item.name}`}
							onclick={() => toggle(item.id)}
						>
							<ChevronRight class={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
						</button>
					{:else}
						<span class="ml-1 size-5.5 shrink-0" aria-hidden="true"></span>
					{/if}

					{#if editing?.id === item.id}
						<!-- svelte-ignore a11y_autofocus -->
						<input
							autofocus
							bind:value={draft}
							class="my-0.5 h-7 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 max-lg:h-11"
							aria-label={`Rename ${item.name}`}
							onkeydown={onEditKeydown}
							onblur={commit}
						/>
					{:else}
						<button
							type="button"
							class={cn(
								'flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2.5 text-left text-sm max-lg:min-h-11',
								folder === item.id && 'font-medium'
							)}
							aria-current={folder === item.id ? 'true' : undefined}
							onclick={() => onselect(item.id)}
						>
							{#if isRoot}
								<Library class="size-4 shrink-0" />
							{:else}
								<FolderIcon class="size-4 shrink-0" />
							{/if}
							<span class="truncate">{item.name}</span>
						</button>
					{/if}

					{#if !isRoot}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								type="button"
								class="mr-1 grid size-6 shrink-0 place-items-center rounded-md opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-lg:size-11 max-lg:opacity-100"
								aria-label={`Folder actions for ${item.name}`}
							>
								<MoreHorizontal class="size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Content class="w-44" align="end">
								<DropdownMenu.Item class="gap-2" onSelect={() => startCreate(item.id)}>
									<FolderPlus class="size-4" />
									New subfolder
								</DropdownMenu.Item>
								<DropdownMenu.Item class="gap-2" onSelect={() => startRename(item)}>
									<Pencil class="size-4" />
									Rename
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									class="gap-2"
									variant="destructive"
									onSelect={() => ondelete(item)}
								>
									<Trash2 class="size-4" />
									Delete
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/if}
				</div>

				{#if isOpen}
					<ul class="space-y-0.5 pl-5">
						{#if editing?.id === null && editing?.parentId === item.id}
							<li>
								<!-- svelte-ignore a11y_autofocus -->
								<input
									autofocus
									bind:value={draft}
									placeholder="New folder"
									class="mr-1 my-0.5 h-7 w-full min-w-0 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 max-lg:h-11"
									aria-label="New subfolder name"
									onkeydown={onEditKeydown}
									onblur={commit}
								/>
							</li>
						{/if}
						{#each kids as kid (kid.id)}
							{@render node(kid)}
						{/each}
					</ul>
				{/if}
			</li>
		{/snippet}

		{@render node(rootNode)}
	</ul>
</nav>
