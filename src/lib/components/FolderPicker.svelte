<script lang="ts">
	// Editor folder menu — browser-style: hovering a folder row opens its children in a
	// submenu (nested to any depth); clicking the row picks that folder. "New folder" in a
	// menu level creates a folder there and picks it. The top item is the virtual root: its
	// label is contextual per view ("Bookmarks bar" / "Notes") and means no folder.
	// Shared by Bookmarks and Notes.
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderPlus from '@lucide/svelte/icons/folder-plus';
	import {
		buildFolderTree,
		folderLabel,
		ROOT_FOLDER_ID,
		type FolderNode,
		type FolderRow
	} from '$lib/folders/tree.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable(null),
		folders,
		label,
		rootLabel,
		oncreate,
		onpick,
		class: className
	}: {
		value?: string | null;
		folders: FolderRow[];
		label: string;
		rootLabel: string;
		oncreate: (parentId: string | null, name: string) => Promise<string | null>;
		onpick?: (id: string | null) => void;
		class?: string;
	} = $props();

	const tree = $derived(buildFolderTree(folders));
	const currentLabel = $derived(value ? folderLabel(folders, value) || rootLabel : rootLabel);

	let open = $state(false);
	let creating = $state<string | null>(null);
	let draft = $state('');
	let creatingInput = $state<HTMLElement | null>(null);

	// A menu can steal focus while opening; refocus the inline input on the next tick.
	$effect(() => {
		if (!creatingInput) return;
		queueMicrotask(() => creatingInput?.focus());
	});

	function pick(id: string | null): void {
		value = id;
		open = false;
		onpick?.(id);
	}

	function startCreate(containerId: string): void {
		draft = '';
		creating = containerId;
	}

	async function commitCreate(): Promise<void> {
		const container = creating;
		if (container === null) return;
		creating = null;

		const name = draft.trim();
		if (!name) return;

		const id = await oncreate(container === ROOT_FOLDER_ID ? null : container, name);
		if (id) pick(id);
	}

	function onInputKeydown(event: KeyboardEvent): void {
		event.stopPropagation();
		if (event.key === 'Enter') {
			event.preventDefault();
			void commitCreate();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			creating = null;
			open = false;
		}
	}
</script>

{#snippet newFolderRow(containerId: string)}
	{#if creating === containerId}
		<div class="px-1.5 py-1">
			<Input
				bind:ref={creatingInput}
				bind:value={draft}
				placeholder="New folder"
				class="h-7 rounded-md px-2 text-sm"
				aria-label="New folder name"
				onkeydown={onInputKeydown}
				onblur={() => (creating = null)}
			/>
		</div>
	{:else}
		<DropdownMenu.Item
			class="gap-2"
			onSelect={(event) => {
				event.preventDefault();
				startCreate(containerId);
			}}
		>
			<FolderPlus class="size-4 text-muted-foreground" />
			New folder
		</DropdownMenu.Item>
	{/if}
{/snippet}

{#snippet level(nodes: FolderNode[])}
	{#each nodes as folder (folder.id)}
		<DropdownMenu.Sub>
			<DropdownMenu.SubTrigger class="gap-2" onSelect={() => pick(folder.id)}>
				<FolderIcon class="size-4 text-muted-foreground" />
				{folder.name}
			</DropdownMenu.SubTrigger>
			<DropdownMenu.SubContent class="w-52" sideOffset={4} alignOffset={-4}>
				{#if folder.children.length > 0}
					{@render level(folder.children)}
					<DropdownMenu.Separator />
				{/if}
				{@render newFolderRow(folder.id)}
			</DropdownMenu.SubContent>
		</DropdownMenu.Sub>
	{/each}
{/snippet}

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger
		type="button"
		class={cn(
			'border-input dark:bg-input/30 dark:hover:bg-input/50 flex h-8 w-full items-center justify-between gap-2 rounded-lg border bg-transparent px-2.5 py-1 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 max-lg:h-11',
			className
		)}
		aria-label={label}
	>
		{currentLabel}
		<ChevronDown class="size-4 opacity-50" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-56" align="start">
		<DropdownMenu.Item class="gap-2" onSelect={() => pick(null)}>
			<FolderIcon class="size-4 text-muted-foreground" />
			{rootLabel}
		</DropdownMenu.Item>
		<DropdownMenu.Separator />

		{@render level(tree)}
		<DropdownMenu.Separator />
		{@render newFolderRow(ROOT_FOLDER_ID)}
	</DropdownMenu.Content>
</DropdownMenu.Root>
