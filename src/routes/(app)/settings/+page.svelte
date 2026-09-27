<script lang="ts">
	// Settings page (#88): self-service change password. The server action
	// (`authActions.changePassword`, backend #86) validates current/new and revokes
	// the other sessions. Matching the confirmation field is a deliberate
	// client-side guard — the backend contract is out of this UI issue's scope,
	// so a direct no-JS post gets only the server-side rules.
	import { enhance } from '$app/forms';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { toast } from 'svelte-sonner';
	import FormAlert from '$lib/components/FormAlert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PageProps } from './$types.js';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let mismatch = $state(false);

	const failure = $derived(form && 'message' in form ? form : null);
	const currentError = $derived(failure?.field === 'currentPassword' ? failure.message : '');
	const newError = $derived(failure?.field === 'newPassword' ? failure.message : '');
	const formError = $derived(failure && !failure.field ? failure.message : '');
</script>

<div class="max-w-2xl">
	<Card>
		<CardHeader>
			<CardTitle>Change password</CardTitle>
			<CardDescription>
				Changing your password signs out your other sessions; this one stays active.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/changePassword"
				class="space-y-4"
				use:enhance={({ formData, cancel }) => {
					if (formData.get('newPassword') !== formData.get('confirmPassword')) {
						mismatch = true;
						cancel();
						return;
					}

					mismatch = false;
					submitting = true;

					return async ({ result, update }) => {
						await update();
						submitting = false;
						if (result.type === 'success') {
							toast.success('Password changed');
						}
					};
				}}
			>
				{#if formError}
					<FormAlert message={formError} />
				{/if}

				<div class="space-y-2">
					<Label for="settings-current-password">Current password</Label>
					<Input
						id="settings-current-password"
						name="currentPassword"
						type="password"
						autocomplete="current-password"
						required
						aria-invalid={currentError !== ''}
						aria-describedby={currentError ? 'settings-current-password-error' : undefined}
					/>
					{#if currentError}
						<p id="settings-current-password-error" role="alert" class="text-sm text-destructive">
							{currentError}
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="settings-new-password">New password</Label>
					<Input
						id="settings-new-password"
						name="newPassword"
						type="password"
						autocomplete="new-password"
						required
						aria-invalid={newError !== ''}
						aria-describedby={newError
							? 'settings-new-password-error'
							: 'settings-new-password-hint'}
					/>
					{#if newError}
						<p id="settings-new-password-error" role="alert" class="text-sm text-destructive">
							{newError}
						</p>
					{:else}
						<p id="settings-new-password-hint" class="text-sm text-muted-foreground">
							At least 8 characters.
						</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="settings-confirm-password">Confirm new password</Label>
					<Input
						id="settings-confirm-password"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
						aria-invalid={mismatch}
						aria-describedby={mismatch ? 'settings-confirm-password-error' : undefined}
						oninput={() => (mismatch = false)}
					/>
					{#if mismatch}
						<p id="settings-confirm-password-error" role="alert" class="text-sm text-destructive">
							The passwords do not match.
						</p>
					{/if}
				</div>

				<Button type="submit" disabled={submitting} class="min-w-40 max-sm:h-11">
					{#if submitting}
						<LoaderCircle class="size-4 animate-spin" />
						<span class="sr-only">Changing password</span>
					{:else}
						Change password
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
