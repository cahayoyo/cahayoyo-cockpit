<script lang="ts">
	// Dashboard widget: the 5 most recently updated notes, pinned not elevated
	// (selection happens in $lib/dashboard/select). Rows deep-link to /notes?note=<id>.
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import { resolve } from '$app/paths';
	import type { NoteItem } from '$lib/components/notes/types.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatRelativeTime } from '$lib/notes/format.js';
	import { tagBadgeClass } from '$lib/notes/tag-badges.js';
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
						<span class="block truncate text-sm font-medium">{note.title}</span>
						<span class="line-clamp-2 break-words text-xs text-muted-foreground">
							{note.snippet || 'Empty note'}
						</span>
						<span class="mt-1 flex flex-wrap items-center gap-1.5">
							<span class="text-xs text-muted-foreground tabular-nums">
								{formatRelativeTime(note.updatedAt)}
							</span>
							{#each note.tags as tag (tag)}
								<Badge variant="outline" class={tagBadgeClass(tag)}>{tag}</Badge>
							{/each}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</WidgetCard>
