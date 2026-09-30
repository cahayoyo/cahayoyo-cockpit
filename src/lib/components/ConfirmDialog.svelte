<script lang="ts">
	// Confirmation dialog for destructive actions: an explicit verb on the button and the
	// record's identity in the description (DESIGN.md > Dialog). Shared by Bookmarks and Notes.
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { failureMessage } from '$lib/forms.js';
	import { Button, type ButtonVariant } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel,
		action,
		fields,
		successMessage,
		variant = 'destructive',
		confirmPhrase = '',
		onsuccess
	}: {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel: string;
		action: string;
		fields: Record<string, string>;
		successMessage: string;
		/** The confirm button style; destructive by default, override for non-lossy actions. */
		variant?: ButtonVariant;
		/** When set, the confirm stays disabled until this exact text is typed (irreversible actions). */
		confirmPhrase?: string;
		onsuccess?: () => void;
	} = $props();

	let typed = $state('');

	// Clear the typed confirmation whenever the dialog closes.
	$effect(() => {
		if (!open) typed = '';
	});

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

			{#if confirmPhrase}
				<div class="space-y-2">
					<Label for="confirm-phrase">
						Type <span class="font-medium text-foreground">{confirmPhrase}</span> to confirm
					</Label>
					<Input
						id="confirm-phrase"
						bind:value={typed}
						autocomplete="off"
						autocapitalize="off"
						spellcheck={false}
					/>
				</div>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" {variant} disabled={confirmPhrase !== '' && typed !== confirmPhrase}>
					{confirmLabel}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
