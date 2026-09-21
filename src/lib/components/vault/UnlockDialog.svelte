<script lang="ts">
	// Unlock dialog (final in every variant): posts the account password to
	// `?/unlockVault`, keeps the inline wrong-password error. The page resumes the
	// pending gated action on success and drops it when the dialog closes.
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { failureMessage } from '$lib/forms.js';

	let {
		open = $bindable(false),
		onunlock
	}: {
		open?: boolean;
		onunlock: () => void;
	} = $props();

	let password = $state('');
	let error = $state('');

	$effect(() => {
		if (open) {
			password = '';
			error = '';
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Unlock vault</Dialog.Title>
			<Dialog.Description>
				Revealing and editing encrypted entries needs the vault unlocked.
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/unlockVault"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					open = false;
					onunlock();
				}}
		>
			<div class="space-y-1">
				<Label for="vault-unlock-password">Password</Label>
				<Input
					id="vault-unlock-password"
					name="password"
					type="password"
					bind:value={password}
					autocomplete="current-password"
					aria-invalid={error !== ''}
				/>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={password === ''}>Unlock</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
