<script lang="ts">
	// Bookmark editor dialog (create + edit). Client validation only gates the submit
	// button; the form action re-validates every field server-side.
	import ImageIcon from '@lucide/svelte/icons/image';
	import Star from '@lucide/svelte/icons/star';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { failureMessage } from '$lib/forms.js';
	import type { FolderRow } from '$lib/folders/tree.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import FolderPicker from '$lib/components/FolderPicker.svelte';
	import MediaPickerDialog from './MediaPickerDialog.svelte';
	import type { BookmarkItem, MediaItem } from './types.js';

	let {
		open = $bindable(false),
		bookmark = null,
		media,
		folders,
		tags,
		oncreate
	}: {
		open?: boolean;
		bookmark?: BookmarkItem | null;
		media: MediaItem[];
		folders: FolderRow[];
		tags: string[];
		oncreate: (parentId: string | null, name: string) => Promise<string | null>;
	} = $props();

	type Draft = {
		title: string;
		url: string;
		description: string;
		tagsText: string;
		folderId: string | null;
		favorite: boolean;
	};

	const EMPTY: Draft = {
		title: '',
		url: '',
		description: '',
		tagsText: '',
		folderId: null,
		favorite: false
	};

	let draft = $state<Draft>({ ...EMPTY });
	let imageId = $state<string | null>(null);
	let pickerOpen = $state(false);
	let error = $state('');

	$effect(() => {
		if (!open) return;
		draft = bookmark
			? {
					title: bookmark.title,
					url: bookmark.url,
					description: bookmark.description ?? '',
					tagsText: bookmark.tags.join(', '),
					folderId: bookmark.folderId,
					favorite: bookmark.favorite
				}
			: { ...EMPTY };
		imageId = bookmark?.imageId ?? null;
		error = '';
	});

	const selected = $derived(media.find((item) => item.id === imageId) ?? null);
	const urlInvalid = $derived(
		draft.url.trim().length > 0 && !/^https?:\/\//.test(draft.url.trim())
	);
	const canSave = $derived(
		draft.title.trim().length > 0 && draft.url.trim().length > 0 && !urlInvalid
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{bookmark ? 'Edit bookmark' : 'New bookmark'}</Dialog.Title>
			<Dialog.Description>
				{bookmark ? 'Update the link details.' : 'Save a link with an optional preview image.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="min-w-0 space-y-4"
			method="post"
			action="?/saveBookmark"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					toast.success(bookmark ? 'Bookmark updated' : 'Bookmark saved');
					open = false;
				}}
		>
			<input type="hidden" name="id" value={bookmark?.id ?? ''} />
			<input type="hidden" name="imageId" value={imageId ?? ''} />
			<input type="hidden" name="folderId" value={draft.folderId ?? ''} />
			<input type="hidden" name="favorite" value={draft.favorite ? 'on' : ''} />

			<div class="space-y-2">
				<Label for="bm-title">Title</Label>
				<Input id="bm-title" name="title" bind:value={draft.title} placeholder="SvelteKit docs" />
			</div>

			<div class="space-y-2">
				<Label for="bm-url">URL</Label>
				<Input
					id="bm-url"
					name="url"
					bind:value={draft.url}
					placeholder="https://example.com/page"
					aria-invalid={urlInvalid}
				/>
				{#if urlInvalid}
					<p class="text-sm text-destructive">Only http:// and https:// links are allowed.</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="bm-description">Description</Label>
				<Textarea
					id="bm-description"
					name="description"
					bind:value={draft.description}
					placeholder="Optional note about this link"
				/>
			</div>

			<div class="space-y-2">
				<Label for="bm-tags">Tags</Label>
				<Input
					id="bm-tags"
					name="tags"
					bind:value={draft.tagsText}
					list="bookmark-tags"
					placeholder="qa, docs"
				/>
				<datalist id="bookmark-tags">
					{#each tags as tag (tag)}
						<option value={tag}></option>
					{/each}
				</datalist>
				<p class="text-xs text-muted-foreground">Comma-separated; type to reuse an existing tag.</p>
			</div>

			<div class="space-y-2">
				<span class="text-sm font-medium">Folder</span>
				<FolderPicker
					bind:value={draft.folderId}
					{folders}
					label="Folder"
					rootLabel="Bookmarks bar"
					{oncreate}
					class="w-full"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant={draft.favorite ? 'secondary' : 'outline'}
					aria-pressed={draft.favorite}
					onclick={() => (draft.favorite = !draft.favorite)}
				>
					<Star class={cn(draft.favorite && 'fill-primary text-primary')} />
					Favorite
				</Button>
			</div>

			<div class="space-y-2">
				<span class="text-sm font-medium">Image</span>
				<div class="flex items-center gap-3">
					<div class="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
						{#if selected}
							<img src="/media/{selected.id}" alt="" class="size-full object-cover" />
						{:else}
							<ImageIcon class="size-5 text-muted-foreground" />
						{/if}
					</div>
					<div class="flex items-center gap-1">
						<Button type="button" variant="outline" size="sm" onclick={() => (pickerOpen = true)}>
							{selected ? 'Change image' : 'Choose image'}
						</Button>
						{#if selected}
							<Button type="button" variant="ghost" size="sm" onclick={() => (imageId = null)}>
								Remove
							</Button>
						{/if}
					</div>
				</div>
				<p class="text-xs text-muted-foreground">
					{selected ? selected.originalName : 'Optional — cards fall back to the title initial.'}
				</p>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={!canSave}>
					{bookmark ? 'Save changes' : 'Add bookmark'}
				</Button>
			</Dialog.Footer>
		</form>

		<MediaPickerDialog
			bind:open={pickerOpen}
			{media}
			selectedId={imageId}
			onpick={(id) => {
				imageId = id;
				pickerOpen = false;
			}}
		/>
	</Dialog.Content>
</Dialog.Root>
