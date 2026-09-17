<script lang="ts">
	// Image library picker: drag/drop or browse (validated client-side) → crop dialog →
	// the cropped blob is uploaded through the form action and auto-picked. Existing
	// images show name, size, and usage; deletion is blocked while referenced.
	import Check from '@lucide/svelte/icons/check';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Upload from '@lucide/svelte/icons/upload';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { failureMessage } from './actions.js';
	import { formatBytes } from '$lib/bookmarks/format.js';
	import { validateUpload } from '$lib/bookmarks/upload.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import ImageCropDialog from './ImageCropDialog.svelte';
	import type { MediaItem } from './types.js';

	let {
		open = $bindable(false),
		media,
		selectedId = null,
		onpick
	}: {
		open?: boolean;
		media: MediaItem[];
		selectedId?: string | null;
		onpick: (id: string) => void;
	} = $props();

	let error = $state('');
	let cropFile = $state<File | null>(null);
	let cropOpen = $state(false);
	let deleting = $state<MediaItem | null>(null);
	let deleteOpen = $state(false);
	let uploadInput: HTMLInputElement;
	let uploadForm: HTMLFormElement;

	function addFile(files: FileList | null): void {
		error = '';
		const file = files?.[0];
		if (!file) return;

		const invalid = validateUpload(file);
		if (invalid) {
			error = invalid;
			return;
		}

		cropFile = file;
		cropOpen = true;
	}

	function askDelete(item: MediaItem): void {
		deleting = item;
		deleteOpen = true;
	}

	function upload(cropped: { blob: Blob; name: string }): void {
		// The form action gets the cropped bytes; a file input cannot be assigned a path,
		// only a File (DataTransfer), so the hidden input is filled and submitted.
		const file = new File([cropped.blob], cropped.name, { type: cropped.blob.type });
		const transfer = new DataTransfer();
		transfer.items.add(file);
		uploadInput.files = transfer.files;
		uploadForm.requestSubmit();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Image library</Dialog.Title>
			<Dialog.Description>Upload once, reuse the same image across bookmarks.</Dialog.Description>
		</Dialog.Header>

		<label
			class="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-input p-6 text-center transition-colors hover:bg-accent"
			ondragover={(event) => event.preventDefault()}
			ondrop={(event) => {
				event.preventDefault();
				addFile(event.dataTransfer?.files ?? null);
			}}
		>
			<Upload class="size-5 text-muted-foreground" />
			<span class="text-sm font-medium">Click to upload or drop an image</span>
			<span class="text-xs text-muted-foreground">JPEG, PNG, or WebP — up to 5 MB</span>
			<input
				type="file"
				class="sr-only"
				accept="image/jpeg,image/png,image/webp"
				onchange={(event) => {
					addFile(event.currentTarget.files);
					// Reset so picking the same file again (e.g. after cancelling the crop)
					// fires another change event.
					event.currentTarget.value = '';
				}}
			/>
		</label>

		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		<div class="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
			{#each media as item (item.id)}
				<div class="overflow-hidden rounded-lg ring-1 ring-foreground/10">
					<button
						type="button"
						class="relative block w-full cursor-pointer"
						aria-label="Use {item.originalName}"
						onclick={() => onpick(item.id)}
					>
						<img src="/media/{item.id}" alt="" class="aspect-square w-full object-cover" />
						{#if item.id === selectedId}
							<span
								class="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground"
							>
								<Check class="size-3" />
							</span>
						{/if}
					</button>
					<div class="flex items-center gap-1 p-1.5">
						<div class="min-w-0 flex-1">
							<p class="truncate text-xs">{item.originalName}</p>
							<p class="text-xs text-muted-foreground">
								{formatBytes(item.sizeBytes)} · {item.usageCount > 0 ? 'in use' : 'unused'}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon-xs"
							class="text-destructive max-lg:size-9"
							disabled={item.usageCount > 0}
							aria-label="Delete {item.originalName}"
							title={item.usageCount > 0
								? 'Cannot delete while a bookmark or note uses this image'
								: 'Delete image'}
							onclick={() => askDelete(item)}
						>
							<Trash2 class="size-3.5" />
						</Button>
					</div>
				</div>
			{/each}
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (open = false)}>Close</Button>
		</Dialog.Footer>

		<form
			bind:this={uploadForm}
			method="post"
			action="?/uploadMedia"
			enctype="multipart/form-data"
			class="hidden"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					if (result.type === 'success' && typeof result.data?.mediaId === 'string') {
						toast.success('Image added');
						onpick(result.data.mediaId);
					}
				}}
		>
			<input bind:this={uploadInput} type="file" name="file" tabindex="-1" aria-hidden="true" />
		</form>

		<ImageCropDialog bind:open={cropOpen} file={cropFile} oncrop={upload} />

		<ConfirmDialog
			bind:open={deleteOpen}
			title="Delete image"
			description={deleting ? `"${deleting.originalName}" will be removed from the library.` : ''}
			confirmLabel="Delete image"
			action="?/deleteMedia"
			fields={deleting ? { id: deleting.id } : {}}
			successMessage="Image deleted"
			onsuccess={() => (deleting = null)}
		/>
	</Dialog.Content>
</Dialog.Root>
