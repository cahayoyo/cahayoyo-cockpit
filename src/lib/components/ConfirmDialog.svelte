<script lang="ts">
	// Confirmation dialog for destructive actions: an explicit verb on the button and the
	// record's identity in the description (DESIGN.md > Dialog). Shared by Bookmarks and Notes.
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { failureMessage } from '$lib/forms.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel,
		action,
		fields,
		successMessage,
		onsuccess
	}: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel: string;
		action: string;
		fields: Record<string, string>;
		successMessage: string;
		onsuccess?: () => void;
	} = $props();

	const submit: SubmitFunction =
		() =>
		async ({ result, update }) => {
			if (result.type === 'failure') {
				toast.error(failureMessage(result.data));
				return;
			}

			await update();
			toast.success(successMessage);
			open = false;
			onsuccess?.();
		};
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>{description}</Dialog.Description>
		</Dialog.Header>

		<form method="post" {action} use:enhance={submit}>
			{#each Object.entries(fields) as [name, value] (name)}
				<input type="hidden" {name} {value} />
			{/each}

			<Dialog.Footer>
				<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" variant="destructive">{confirmLabel}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
