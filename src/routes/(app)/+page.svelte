<script lang="ts">
	// Dashboard home (variant A): Today + Active tasks top row, Recent notes +
	// Favorite bookmarks bottom row. One server load; the pure helpers in
	// $lib/dashboard/select derive each widget's slice.
	import ActiveTasksWidget from '$lib/components/dashboard/ActiveTasksWidget.svelte';
	import FavoriteBookmarksWidget from '$lib/components/dashboard/FavoriteBookmarksWidget.svelte';
	import RecentNotesWidget from '$lib/components/dashboard/RecentNotesWidget.svelte';
	import TodayWidget from '$lib/components/dashboard/TodayWidget.svelte';
	import {
		selectActiveTasks,
		selectFavoriteBookmarks,
		selectRecentNotes,
		selectTodayTasks
	} from '$lib/dashboard/select.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	const today = $derived(selectTodayTasks(data.tasks, data.today));
	const active = $derived(selectActiveTasks(data.tasks));
	const notes = $derived(selectRecentNotes(data.notes));
	const bookmarks = $derived(selectFavoriteBookmarks(data.bookmarks));
</script>

<div class="grid gap-4 lg:grid-cols-2">
	<TodayWidget tasks={today.items} hidden={today.hidden} today={data.today} />
	<ActiveTasksWidget tasks={active.items} counts={active.counts} />
	<RecentNotesWidget {notes} />
	<FavoriteBookmarksWidget {bookmarks} />
</div>
