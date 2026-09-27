<script lang="ts">
	// One shared row body for the Notes list and the dashboard "Recent notes"
	// widget: title (+ optional pin), clamped preview, relative time, tag
	// badges. The interactive wrapper differs per surface (link vs button).
	import Pin from '@lucide/svelte/icons/pin';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { formatRelativeTime } from '$lib/notes/format.js';
	import { tagBadgeClass } from '$lib/notes/tag-badges.js';
	import type { NoteItem } from './types.js';

	let { note, showPin = false }: { note: NoteItem; showPin?: boolean } = $props();
</script>

<div class="flex items-center gap-1.5">
	{#if showPin && note.pinned}
		<Pin class="size-3 shrink-0 text-muted-foreground" />
	{/if}
	<span class="truncate text-sm font-medium">{note.title || 'Untitled'}</span>
</div>
<p class="line-clamp-2 break-words text-xs text-muted-foreground">
	{note.snippet || 'Empty note'}
</p>
<div class="mt-1 flex flex-wrap items-center gap-1.5">
	<span class="text-xs text-muted-foreground tabular-nums">
		{formatRelativeTime(note.updatedAt)}
	</span>
	{#each note.tags as tag (tag)}
		<Badge variant="outline" class={tagBadgeClass(tag)}>{tag}</Badge>
	{/each}
</div>
