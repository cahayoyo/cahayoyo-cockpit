<script lang="ts">
	// Persistent inline error banner (DESIGN.md > Toast / Alert). Shared by the
	// auth forms so the destructive-alert markup lives in one place.
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	let { message }: { message: string } = $props();
</script>

<div
	class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3"
	role="alert"
>
	<CircleAlert class="size-4 shrink-0 text-destructive" />
	<p class="text-sm text-destructive">{message}</p>
</div>
