<script lang="ts">
	// Dashboard widget: the 5 most recently updated notes, pinned not elevated
	// (selection happens in $lib/dashboard/select). Rows deep-link to /notes?note=<id>.
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { resolve } from '$app/paths';
	import NoteRowContent from '$lib/components/notes/NoteRowContent.svelte';
	import type { NoteItem } from '$lib/components/notes/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import WidgetCard from './WidgetCard.svelte';

	let { notes }: { notes: NoteItem[] } = $props();
</script>

<WidgetCard title="Recent notes" href="/notes" icon={NotebookPen}>
	{#if notes.length === 0}
		<div class="flex flex-col items-center gap-3 py-4 text-center">
			<NotebookPen class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No notes yet.</p>
			<Button variant="outline" size="sm" class="max-sm:h-11" href={resolve('/notes')}>
				Add a note
			</Button>
		</div>
	{:else}
		<ul class="space-y-1">
			{#each notes as note (note.id)}
				<li>
					<a
						href={resolve(`/notes?note=${note.id}`)}
						class="block rounded-lg p-2 transition-colors hover:bg-accent max-lg:min-h-11"
					>
						<NoteRowContent {note} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</WidgetCard>
