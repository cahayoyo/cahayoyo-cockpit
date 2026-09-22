<script lang="ts">
	// Upload cropper: drag the frame (or its corners) inside the image, optionally locking
	// the aspect ratio, then rasterize the selection with a canvas. The cropped blob is
	// re-validated (mime + 5 MB) before it leaves the dialog.
	import Info from '@lucide/svelte/icons/info';
	import { moveRect, resizeRect, type CropCorner, type CropRect } from '$lib/bookmarks/crop.js';
	import { validateUpload } from '$lib/bookmarks/upload.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';

	const CORNERS: { key: CropCorner; class: string }[] = [
		{ key: 'nw', class: 'cursor-nwse-resize' },
		{ key: 'ne', class: 'cursor-nesw-resize' },
		{ key: 'sw', class: 'cursor-nesw-resize' },
		{ key: 'se', class: 'cursor-nwse-resize' }
	];

	const MIN = 24;

	let {
		open = $bindable(false),
		file = null,
		oncrop
	}: {
		open?: boolean;
		file?: File | null;
		oncrop: (result: { blob: Blob; name: string }) => void;
	} = $props();

	let imgEl = $state<HTMLImageElement | null>(null);
	let src = $state('');
	let natural = $state({ w: 0, h: 0 });
	let view = $state({ w: 0, h: 0 });
	let rect = $state<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
	let lock = $state(true);
	let ratio = $state(1);
	let error = $state('');
	let drag = $state<{
		mode: 'move' | CropCorner;
		startX: number;
		startY: number;
		orig: CropRect;
	} | null>(null);

	const scale = $derived(view.w > 0 ? natural.w / view.w : 1);
	const masks = $derived([
		{ x: 0, y: 0, w: view.w, h: rect.y },
		{ x: 0, y: rect.y + rect.h, w: view.w, h: Math.max(0, view.h - rect.y - rect.h) },
		{ x: 0, y: rect.y, w: rect.x, h: rect.h },
		{ x: rect.x + rect.w, y: rect.y, w: Math.max(0, view.w - rect.x - rect.w), h: rect.h }
	]);

	$effect(() => {
		if (!open || !file) return;
		const url = URL.createObjectURL(file);
		src = url;
		return () => URL.revokeObjectURL(url);
	});

	function onImageLoad(): void {
		if (!imgEl) return;
		natural = { w: imgEl.naturalWidth, h: imgEl.naturalHeight };
		view = { w: imgEl.clientWidth, h: imgEl.clientHeight };
		const side = Math.min(view.w, view.h) * 0.85;
		rect = { x: (view.w - side) / 2, y: (view.h - side) / 2, w: side, h: side };
		ratio = 1;
	}

	function toggleLock(): void {
		lock = !lock;
		if (lock) ratio = rect.w / rect.h;
	}

	function startDrag(event: PointerEvent, mode: 'move' | CropCorner): void {
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		drag = { mode, startX: event.clientX, startY: event.clientY, orig: { ...rect } };
	}

	function onDrag(event: PointerEvent): void {
		if (!drag) return;
		const dx = event.clientX - drag.startX;
		const dy = event.clientY - drag.startY;
		rect =
			drag.mode === 'move'
				? moveRect(drag.orig, dx, dy, view.w, view.h)
				: resizeRect(drag.orig, drag.mode, dx, dy, view.w, view.h, lock ? ratio : null, MIN);
	}

	function endDrag(): void {
		drag = null;
	}

	function crop(): void {
		if (!imgEl || !file || rect.w < 1 || rect.h < 1) return;
		error = '';

		// Map the rendered frame back to natural pixels so the export is not downscaled.
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(rect.w * scale);
		canvas.height = Math.round(rect.h * scale);
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(
			imgEl,
			rect.x * scale,
			rect.y * scale,
			canvas.width,
			canvas.height,
			0,
			0,
			canvas.width,
			canvas.height
		);

		const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
		const name = type === 'image/jpeg' ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name;

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const invalid = validateUpload({ type: blob.type, size: blob.size });
				if (invalid) {
					error = invalid;
					return;
				}

				oncrop({ blob, name });
				open = false;
			},
			type,
			type === 'image/jpeg' ? 0.92 : undefined
		);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Crop image</Dialog.Title>
			<Dialog.Description>
				Drag the frame or its corners to choose the visible area.
			</Dialog.Description>
		</Dialog.Header>

		<div class="overflow-hidden rounded-xl bg-muted p-3">
			<div class="relative mx-auto w-fit">
				{#if src}
					<img
						bind:this={imgEl}
						{src}
						alt="Crop preview"
						draggable="false"
						class="block max-h-96 max-w-full rounded-md select-none"
						onload={onImageLoad}
					/>
				{/if}

				{#if view.w > 0}
					{#each masks as mask, index (index)}
						<div
							class="pointer-events-none absolute bg-black/50"
							style="left: {mask.x}px; top: {mask.y}px; width: {mask.w}px; height: {mask.h}px;"
						></div>
					{/each}

					<button
						type="button"
						aria-label="Move crop frame"
						class="absolute cursor-move touch-none"
						style="left: {rect.x}px; top: {rect.y}px; width: {rect.w}px; height: {rect.h}px;"
						onpointerdown={(event) => startDrag(event, 'move')}
						onpointermove={onDrag}
						onpointerup={endDrag}
						onpointercancel={endDrag}
					>
						<span class="pointer-events-none absolute inset-0 border border-white/90"></span>
					</button>

					{#each CORNERS as corner (corner.key)}
						<button
							type="button"
							aria-label="Resize crop frame"
							class={cn(
								'absolute size-3 touch-none rounded-sm border-2 border-background bg-primary',
								corner.class
							)}
							style="left: {corner.key === 'nw' || corner.key === 'sw'
								? rect.x - 6
								: rect.x + rect.w - 6}px; top: {corner.key === 'nw' || corner.key === 'ne'
								? rect.y - 6
								: rect.y + rect.h - 6}px;"
							onpointerdown={(event) => startDrag(event, corner.key)}
							onpointermove={onDrag}
							onpointerup={endDrag}
							onpointercancel={endDrag}
						></button>
					{/each}
				{/if}
			</div>
		</div>

		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		<div class="flex items-center justify-center gap-2">
			<button
				type="button"
				role="switch"
				aria-checked={lock}
				aria-label="Lock aspect ratio"
				class={cn(
					'relative h-6 w-11 shrink-0 rounded-full transition-colors',
					lock ? 'bg-primary' : 'bg-input'
				)}
				onclick={toggleLock}
			>
				<span
					class={cn(
						'absolute top-0.5 left-0.5 size-5 rounded-full bg-background transition-transform',
						lock && 'translate-x-5'
					)}
				></span>
			</button>
			<span class="text-sm">Lock aspect ratio</span>
			<span
				class="inline-flex text-muted-foreground"
				title="Keeps the frame shape while you resize it."
			>
				<Info class="size-3.5" />
			</span>
		</div>

		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={crop}>Crop</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
