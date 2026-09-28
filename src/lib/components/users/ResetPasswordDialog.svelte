<script lang="ts">
	// Reset-password dialog (#89). The super admin sets a new password for one
	// account; the server action validates it and revokes that account's other
	// sessions (a reset owns them). Confirm-match is a deliberate client-only
	// guard, same as the Settings page.
	import { enhance } from '$app/forms';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { toast } from 'svelte-sonner';
	import FormAlert from '$lib/components/FormAlert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { failureMessage } from '$lib/forms.js';
	import type { AccountListItem } from '$lib/users/types.js';

	let {
		open = $bindable(false),
		account = null,
		onsuccess
	}: {
		open?: boolean;
		account?: AccountListItem | null;
		onsuccess?: () => void;
	} = $props();

	let password = $state('');
	let confirm = $state('');
	let error = $state('');
	let mismatch = $state(false);
	let submitting = $state(false);
	let syncedId = $state<string | null>(null);

	// Reset the draft when the dialog opens or switches account.
	$effect(() => {
		const key = open ? (account?.id ?? 'open') : null;
		if (key === syncedId) return;
		syncedId = key;
		if (key === null) return;

		password = '';
		confirm = '';
		error = '';
		mismatch = false;
		submitting = false;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Reset password</Dialog.Title>
			<Dialog.Description>
				{account
					? `Set a new password for ${account.email}. This signs the account out everywhere.`
					: 'Set a new password for this account.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/resetUserPassword"
			use:enhance={({ formData, cancel }) => {
				if (formData.get('newPassword') !== formData.get('confirmPassword')) {
					mismatch = true;
					cancel();
					return;
				}

				mismatch = false;
				error = '';
				submitting = true;

				return async ({ result, update }) => {
					submitting = false;
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					toast.success('Password reset');
					open = false;
					onsuccess?.();
				};
			}}
		>
			<input type="hidden" name="userId" value={account?.id ?? ''} />

			{#if error}
				<FormAlert message={error} />
			{/if}

			<div class="space-y-2">
				<Label for="reset-password">New password</Label>
				<Input
					id="reset-password"
					name="newPassword"
					type="password"
					autocomplete="new-password"
					bind:value={password}
					aria-describedby="reset-password-hint"
					required
				/>
				<p id="reset-password-hint" class="text-sm text-muted-foreground">At least 8 characters.</p>
			</div>

			<div class="space-y-2">
				<Label for="reset-confirm">Confirm new password</Label>
				<Input
					id="reset-confirm"
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					bind:value={confirm}
					aria-invalid={mismatch}
					aria-describedby={mismatch ? 'reset-confirm-error' : undefined}
					oninput={() => (mismatch = false)}
					required
				/>
				{#if mismatch}
					<p id="reset-confirm-error" role="alert" class="text-sm text-destructive">
						The passwords do not match.
					</p>
				{/if}
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
						<span class="sr-only">Resetting password</span>
					{:else}
						Reset password
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
