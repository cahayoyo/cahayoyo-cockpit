<script lang="ts">
	// Dashboard home (variant A): Active tasks + Recent vault top row, Recent
	// notes + Favorite bookmarks bottom row. One server load; the pure helpers in
	// $lib/dashboard/select derive each widget's slice.
	import ActiveTasksWidget from '$lib/components/dashboard/ActiveTasksWidget.svelte';
	import FavoriteBookmarksWidget from '$lib/components/dashboard/FavoriteBookmarksWidget.svelte';
	import RecentNotesWidget from '$lib/components/dashboard/RecentNotesWidget.svelte';
	import RecentVaultWidget from '$lib/components/dashboard/RecentVaultWidget.svelte';
	import {
		selectActiveTasks,
		selectFavoriteBookmarks,
		selectRecentNotes,
		selectRecentVault
	} from '$lib/dashboard/select.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	const active = $derived(selectActiveTasks(data.tasks));
	const vault = $derived(selectRecentVault(data.entries));
	const notes = $derived(selectRecentNotes(data.notes));
	const bookmarks = $derived(selectFavoriteBookmarks(data.bookmarks));
</script>

<div class="grid gap-4 lg:grid-cols-2">
	<ActiveTasksWidget tasks={active.items} counts={active.counts} />
	<RecentVaultWidget entries={vault} />
	<RecentNotesWidget {notes} />
	<FavoriteBookmarksWidget {bookmarks} />
</div>
