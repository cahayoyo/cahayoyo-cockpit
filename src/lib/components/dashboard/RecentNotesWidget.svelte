<script lang="ts">
	// Dashboard widget: the 5 most recently updated notes, pinned not elevated
	// (selection happens in $lib/dashboard/select). Rows deep-link to /notes?note=<id>.
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { resolve } from '$app/paths';
	import type { NoteItem } from '$lib/components/notes/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { dateInAppZone } from '$lib/tasks/today.js';
	import WidgetCard from './WidgetCard.svelte';

	let { notes }: { notes: NoteItem[] } = $props();
</script>

<WidgetCard title="Recent notes" href="/notes">
	{#if notes.length === 0}
		<div class="flex flex-col items-center gap-3 py-4 text-center">
			<NotebookPen class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No notes yet.</p>
			<Button variant="outline" size="sm" href={resolve('/notes')}>Add a note</Button>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each notes as note (note.id)}
				<li class="flex items-center gap-2">
					<a
						href={resolve(`/notes?note=${note.id}`)}
						class="min-w-0 flex-1 truncate text-sm hover:underline"
					>
						{note.title}
					</a>
					<span class="shrink-0 text-xs text-muted-foreground tabular-nums">
						{dateInAppZone(note.updatedAt)}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</WidgetCard>
