<script lang="ts">
	// Create-account dialog (#89). The super admin sets the initial credential
	// password; the server action validates with the shared account schema and
	// returns a curated message on failure. Fields reset every time the dialog
	// opens so a cancelled draft never leaks into the next create.
	import { enhance } from '$app/forms';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { toast } from 'svelte-sonner';
	import FormAlert from '$lib/components/FormAlert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { failureMessage } from '$lib/forms.js';

	let { open = $bindable(false), onsuccess }: { open?: boolean; onsuccess?: () => void } = $props();

	type Draft = { email: string; name: string; password: string };

	const EMPTY: Draft = { email: '', name: '', password: '' };

	let draft = $state<Draft>({ ...EMPTY });
	let error = $state('');
	let submitting = $state(false);
	let synced = $state(false);

	// Clear the draft on open (never on an unrelated parent re-render).
	$effect(() => {
		if (open === synced) return;
		synced = open;
		if (open) {
			draft = { ...EMPTY };
			error = '';
			submitting = false;
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>New account</Dialog.Title>
			<Dialog.Description>
				Create an account with an initial password. The owner can change it after signing in.
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/createUser"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					toast.success('Account created');
					open = false;
					onsuccess?.();
				};
			}}
		>
			{#if error}
				<FormAlert message={error} />
			{/if}

			<div class="space-y-2">
				<Label for="user-email">Email</Label>
				<Input
					id="user-email"
					name="email"
					type="email"
					autocomplete="off"
					bind:value={draft.email}
					placeholder="teammate@example.com"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="user-name">Name</Label>
				<Input
					id="user-name"
					name="name"
					autocomplete="off"
					bind:value={draft.name}
					placeholder="Teammate name"
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="user-password">Initial password</Label>
				<Input
					id="user-password"
					name="password"
					type="password"
					autocomplete="new-password"
					bind:value={draft.password}
					aria-describedby="user-password-hint"
					required
				/>
				<p id="user-password-hint" class="text-sm text-muted-foreground">At least 8 characters.</p>
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="secondary"
					class="max-sm:h-11"
					onclick={() => (open = false)}
				>
					Cancel
				</Button>
				<Button type="submit" class="max-sm:h-11" disabled={submitting}>
					{#if submitting}
						<LoaderCircle class="size-4 animate-spin" />
						<span class="sr-only">Creating account</span>
					{:else}
						Create account
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
