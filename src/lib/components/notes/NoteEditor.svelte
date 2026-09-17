<script lang="ts">
	// Note editor pane: inline title, save indicator + explicit Save, pin/delete, the
	// segmented pane picker (desktop Source | Split | Preview, narrow Source | Preview),
	// folder picker (root label "Notes"), inline tags, CodeMirror 6 source with the
	// markdown-it preview and one-way source → preview scroll sync, plus the save model
	// (1000ms autosave, Save + Ctrl/Cmd+S, flush on blur/switch/hidden/navigation).
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pin from '@lucide/svelte/icons/pin';
	import PinOff from '@lucide/svelte/icons/pin-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { markdown } from '@codemirror/lang-markdown';
	import { basicSetup, EditorView } from 'codemirror';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { validateUpload } from '$lib/bookmarks/upload.js';
	import { submitAction } from '$lib/forms.js';
	import { type FolderRow } from '$lib/folders/tree.js';
	import { formatTime } from '$lib/notes/format.js';
	import { initialSaveState, reduceSaveState, type NoteSaveState } from '$lib/notes/save-state.js';
	import FolderPicker from '$lib/components/FolderPicker.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils.js';
	import MarkdownPreview from './MarkdownPreview.svelte';
	import type { NoteItem } from './types.js';

	type Pane = 'source' | 'split' | 'preview';

	let {
		note,
		folders,
		tagSuggestions,
		focusTitleAt,
		onFocusHandled,
		onTogglePin,
		onDelete,
		onBack,
		onCreateFolder
	}: {
		note: NoteItem;
		folders: FolderRow[];
		tagSuggestions: string[];
		focusTitleAt: number;
		onFocusHandled: () => void;
		onTogglePin: (note: NoteItem) => void;
		onDelete: (note: NoteItem) => void;
		onBack: () => void;
		onCreateFolder: (parentId: string | null, name: string) => Promise<string | null>;
	} = $props();

	const DESKTOP_PANES: { key: Pane; name: string }[] = [
		{ key: 'source', name: 'Source' },
		{ key: 'split', name: 'Split' },
		{ key: 'preview', name: 'Preview' }
	];
	const NARROW_PANES: { key: Pane; name: string }[] = [
		{ key: 'source', name: 'Source' },
		{ key: 'preview', name: 'Preview' }
	];

	// ---- editor state + save model ------------------------------------------
	// Seeded from the note prop so SSR renders the selected note; the effect below
	// only reacts to later changes (note switch, adopted server state). The prop is
	// read with untrack: these are one-time initial values, not live bindings.
	let title = $state(untrack(() => note.title));
	let body = $state(untrack(() => note.body));
	let tagsText = $state(untrack(() => note.tags.join(', ')));
	let folderId = $state<string | null>(untrack(() => note.folderId));
	let lastServerFolderId = $state<string | null>(untrack(() => note.folderId));
	let saveState = $state<NoteSaveState>(untrack(() => initialSaveState(note.updatedAt)));
	let loadedId = $state<string | null>(untrack(() => note.id));
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	let desktopPane = $state<Pane>('split');
	let narrowPane = $state<'source' | 'preview'>('source');

	function setDesktopPane(pane: Pane): void {
		desktopPane = pane;
	}

	function setNarrowPane(pane: Pane): void {
		narrowPane = pane === 'preview' ? 'preview' : 'source';
	}

	function scheduleSave(): void {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => void flush(), 1000);
	}

	function markEdit(): void {
		saveState = reduceSaveState(saveState, { type: 'edit' });
		scheduleSave();
	}

	// Autosave, Save button, Ctrl/Cmd+S and the flush triggers all land here. The
	// reducer owns the state machine; a save that resolves after a note switch only
	// reports its failure, never writes the new note's state.
	async function flush(keepalive = false): Promise<void> {
		clearTimeout(debounceTimer);
		const id = loadedId;
		if (id === null) return;

		const next = reduceSaveState(saveState, { type: 'save-start' });
		// Proceed only on a real dirty/failed → saving transition: a flush that fires
		// while a save is already in flight (blur + navigation) must not double-post.
		if (next.status !== 'saving' || saveState.status === 'saving') return;
		saveState = next;

		const outcome = await submitAction(
			'?/saveNote',
			{ id, title, body, folderId: folderId ?? '', tags: tagsText },
			{ invalidate: false, keepalive }
		);

		if (outcome.ok) {
			if (id === loadedId) {
				const savedAt = outcome.data.savedAt;
				saveState = reduceSaveState(saveState, {
					type: 'save-success',
					savedAt: typeof savedAt === 'string' ? new Date(savedAt) : new Date()
				});
				// Edits arrived while this save was in flight: keep going.
				if (saveState.status === 'dirty') scheduleSave();
			}
			// Refresh the list row (title, snippet, order) even for a note we just left.
			// Skipped mid-navigation: invalidateAll() during a client-side navigation
			// cancels it, which would strand the user on the page they are leaving.
			if (!keepalive && navigating.to === null) void invalidateAll();
		} else {
			// A late failure for a note we already switched away from cannot restore
			// its dirty state, but the user must still know the edit did not persist.
			if (id === loadedId) {
				saveState = reduceSaveState(saveState, { type: 'save-failure' });
			}
			toast.error(outcome.message);
		}
	}

	// Load a note into the editor. Switching flushes the outgoing note best-effort;
	// adopting a changed server folder keeps the picker in sync when a folder is
	// deleted elsewhere (its notes become unfiled in the DB).
	$effect(() => {
		const incomingId = note.id;

		if (incomingId !== loadedId) {
			if (loadedId !== null) void flush();
			loadedId = incomingId;
			clearTimeout(debounceTimer);
			title = note.title;
			body = note.body;
			tagsText = note.tags.join(', ');
			folderId = note.folderId;
			lastServerFolderId = note.folderId;
			saveState = initialSaveState(note.updatedAt);
			return;
		}

		if (note.folderId !== lastServerFolderId) {
			lastServerFolderId = note.folderId;
			// Adopt the server's folder only when nothing local is pending: a folder
			// deleted elsewhere unfiles the note, but it must not overwrite a folder
			// the user just picked and has not saved yet.
			if (saveState.status === 'clean' || saveState.status === 'saved') {
				folderId = note.folderId;
			}
		}
	});

	// ---- focus the title of a freshly created note --------------------------
	// The page hands over a one-shot token and takes it back once consumed, so a
	// later remount (mobile back/forward) does not steal focus again.
	let titleEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (focusTitleAt === 0) return;
		queueMicrotask(() => {
			if (!titleEl) return;
			titleEl.focus();
			titleEl.select();
			onFocusHandled();
		});
	});

	// ---- CodeMirror 6 source ------------------------------------------------
	let cmHost = $state<HTMLDivElement | null>(null);
	let cmView = $state<EditorView | null>(null);
	let sourceEl: HTMLElement | null = null;
	let previewEl = $state<HTMLElement | null>(null);
	let applyingExternal = false;

	const cmTheme = EditorView.theme({
		'&': {
			height: '100%',
			fontSize: '14px',
			backgroundColor: 'transparent',
			color: 'var(--foreground)'
		},
		'&.cm-focused': { outline: 'none' },
		'.cm-scroller': { fontFamily: 'inherit', lineHeight: '1.6' },
		'.cm-content': { padding: '12px 0' },
		'.cm-gutters': {
			backgroundColor: 'transparent',
			borderRight: '1px solid var(--border)',
			color: 'var(--muted-foreground)'
		},
		'.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--muted) 60%, transparent)' },
		'.cm-activeLineGutter': { backgroundColor: 'transparent' }
	});

	$effect(() => {
		if (!cmHost) return;

		const view = new EditorView({
			doc: untrack(() => body),
			parent: cmHost,
			extensions: [
				basicSetup,
				markdown(),
				EditorView.lineWrapping,
				cmTheme,
				EditorView.domEventHandlers({
					paste: (event) => onPaste(event),
					blur: () => void flush()
				}),
				EditorView.updateListener.of((update) => {
					if (!update.docChanged || applyingExternal) return;
					body = update.state.doc.toString();
					markEdit();
				})
			]
		});

		cmView = view;
		sourceEl = view.scrollDOM;
		view.scrollDOM.addEventListener('scroll', syncPreview);

		return () => {
			view.scrollDOM.removeEventListener('scroll', syncPreview);
			view.destroy();
			cmView = null;
			sourceEl = null;
		};
	});

	// External body changes (note switch) are pushed into CodeMirror behind a guard,
	// otherwise the update listener would mark the freshly loaded note dirty.
	$effect(() => {
		const next = body;
		const view = cmView;
		if (!view || view.state.doc.toString() === next) return;

		applyingExternal = true;
		view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
		applyingExternal = false;
	});

	// One-way proportional sync: source → preview, Split only.
	function syncPreview(): void {
		if (desktopPane !== 'split' || !sourceEl || !previewEl) return;
		const fromMax = sourceEl.scrollHeight - sourceEl.clientHeight;
		const toMax = previewEl.scrollHeight - previewEl.clientHeight;
		if (fromMax <= 0 || toMax <= 0) return;
		previewEl.scrollTop = (sourceEl.scrollTop / fromMax) * toMax;
	}

	// ---- paste-to-upload ----------------------------------------------------
	function onPaste(event: ClipboardEvent): boolean {
		const items = event.clipboardData ? Array.from(event.clipboardData.items) : [];
		const file = items
			.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
			?.getAsFile();
		if (!file) return false;

		event.preventDefault();
		void uploadPastedImage(file);
		return true;
	}

	async function uploadPastedImage(file: File): Promise<void> {
		const invalid = validateUpload(file);
		if (invalid) {
			toast.error(invalid);
			return;
		}

		// The upload outlives a note switch; the reference must land in the note the
		// user pasted into, never in whatever note happens to be open when it resolves.
		const targetId = loadedId;
		const outcome = await submitAction('?/uploadMedia', { file }, { invalidate: false });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return;
		}

		const mediaId = outcome.data.mediaId;
		if (typeof mediaId !== 'string') {
			toast.error('The image could not be uploaded.');
			return;
		}

		if (targetId === null || targetId !== loadedId) {
			toast.error('The note changed while the image uploaded; it is in the media library now.');
			return;
		}

		insertAtCursor(`![pasted image](/media/${mediaId})`);
		toast.success('Image added to the media library');
	}

	function insertAtCursor(text: string): void {
		const view = cmView;
		if (!view) return;

		const { from, to } = view.state.selection.main;
		view.dispatch({
			changes: { from, to, insert: text },
			selection: { anchor: from + text.length }
		});
		view.focus();
	}

	// ---- window-level triggers ----------------------------------------------
	onMount(() => {
		const onKeydown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				void flush();
			}
		};
		const onVisibility = () => {
			if (document.visibilityState === 'hidden') void flush(true);
		};

		window.addEventListener('keydown', onKeydown);
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			window.removeEventListener('keydown', onKeydown);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	beforeNavigate(() => void flush(true));

	function onBeforeUnload(event: BeforeUnloadEvent): void {
		const status = saveState.status;
		if (status === 'dirty' || status === 'saving' || status === 'failed') {
			event.preventDefault();
		}
	}

	const saveDisabled = $derived(saveState.status !== 'dirty' && saveState.status !== 'failed');
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<header class="flex items-center gap-2 border-b border-border px-2 py-1.5">
	<Button
		variant="ghost"
		size="icon-sm"
		class="shrink-0 max-lg:size-11 lg:hidden"
		aria-label="Back to notes"
		onclick={onBack}
	>
		<ArrowLeft class="size-4" />
	</Button>
	<input
		bind:this={titleEl}
		class="min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none placeholder:text-muted-foreground max-lg:h-11"
		aria-label="Note title"
		placeholder="Untitled"
		bind:value={title}
		oninput={markEdit}
		onblur={() => void flush()}
	/>
	{#if saveState.status === 'dirty'}
		<span class="shrink-0 text-xs text-muted-foreground max-sm:hidden">Unsaved changes</span>
	{:else if saveState.status === 'saving'}
		<span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground max-sm:hidden">
			<LoaderCircle class="size-3 animate-spin" /> Saving…
		</span>
	{:else if saveState.status === 'failed'}
		<span class="shrink-0 text-xs text-destructive">Save failed</span>
	{:else if saveState.savedAt}
		<span class="shrink-0 text-xs text-muted-foreground tabular-nums max-sm:hidden">
			Saved {formatTime(saveState.savedAt)}
		</span>
	{/if}
	<Button
		size="sm"
		class="shrink-0 max-lg:h-11"
		disabled={saveDisabled}
		onclick={() => void flush()}
	>
		Save
	</Button>
	<Button
		variant="ghost"
		size="icon-sm"
		class="shrink-0 max-lg:size-11"
		aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
		title={note.pinned ? 'Unpin note' : 'Pin note'}
		onclick={() => onTogglePin(note)}
	>
		{#if note.pinned}
			<PinOff class="size-4" />
		{:else}
			<Pin class="size-4" />
		{/if}
	</Button>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			type="button"
			class="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground max-lg:size-11"
			aria-label="Note actions"
		>
			<MoreHorizontal class="size-4" />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-44" align="end">
			<DropdownMenu.Item class="gap-2" variant="destructive" onSelect={() => onDelete(note)}>
				<Trash2 class="size-4" />
				Delete
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</header>

<div class="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5">
	<div class="max-lg:hidden">{@render panePicker(DESKTOP_PANES, desktopPane, setDesktopPane)}</div>
	<div class="lg:hidden">{@render panePicker(NARROW_PANES, narrowPane, setNarrowPane)}</div>

	<FolderPicker
		class="w-44"
		bind:value={folderId}
		{folders}
		label="Note folder"
		rootLabel="Notes"
		oncreate={onCreateFolder}
		onpick={markEdit}
	/>

	<div class="min-w-0 flex-1">
		<Input
			bind:value={tagsText}
			list="note-tags"
			placeholder="Tags — qa, docs"
			aria-label="Tags"
			class="max-lg:h-11"
			oninput={markEdit}
			onblur={() => void flush()}
		/>
		<datalist id="note-tags">
			{#each tagSuggestions as tag (tag)}
				<option value={tag}></option>
			{/each}
		</datalist>
	</div>
</div>

<div class="flex min-h-0 flex-1">
	<div
		class={cn(
			'min-w-0 flex-1 flex-col',
			narrowPane === 'source' ? 'flex' : 'hidden',
			desktopPane === 'preview' ? 'lg:hidden' : 'lg:flex',
			desktopPane === 'split' && 'lg:border-r lg:border-border'
		)}
	>
		<div class="min-h-0 flex-1 overflow-hidden" bind:this={cmHost}></div>
	</div>
	<div
		class={cn(
			'min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4',
			narrowPane === 'preview' ? 'flex' : 'hidden',
			desktopPane === 'source' ? 'lg:hidden' : 'lg:flex'
		)}
		bind:this={previewEl}
	>
		<MarkdownPreview {body} />
	</div>
</div>

{#snippet panePicker(
	options: { key: Pane; name: string }[],
	active: Pane,
	onpick: (pane: Pane) => void
)}
	<div
		class="flex gap-0.5 rounded-lg border border-border p-0.5"
		role="group"
		aria-label="Editor layout"
	>
		{#each options as option (option.key)}
			<button
				type="button"
				class={cn(
					'rounded-md px-2 py-0.5 text-xs font-medium transition-colors max-lg:min-h-11 max-lg:px-3',
					active === option.key
						? 'bg-accent text-foreground'
						: 'text-muted-foreground hover:bg-accent/50'
				)}
				aria-pressed={active === option.key}
				onclick={() => onpick(option.key)}
			>
				{option.name}
			</button>
		{/each}
	</div>
{/snippet}
