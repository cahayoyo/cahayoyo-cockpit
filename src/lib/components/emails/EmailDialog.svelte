<script lang="ts">
	// Create/edit dialog (grill decision 2): address (required), provider with a
	// native datalist, purpose, linked task, status, notes. Submits to the
	// page's saveEmail action; the client check only gates the submit button.
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { EMAIL_STATUS_META, EMAIL_STATUS_ORDER } from '$lib/emails/presentation.js';
	import type { EmailItem, EmailStatus } from '$lib/emails/types.js';
	import { failureMessage } from '$lib/forms.js';
	import type { EmailTaskOption } from './types.js';

	let {
		open = $bindable(false),
		email = null,
		tasks,
		providers
	}: {
		open?: boolean;
		email?: EmailItem | null;
		tasks: EmailTaskOption[];
		providers: string[];
	} = $props();

	type Draft = {
		address: string;
		provider: string;
		purpose: string;
		taskId: string;
		status: EmailStatus;
		notes: string;
	};

	const EMPTY: Draft = {
		address: '',
		provider: '',
		purpose: '',
		taskId: 'none',
		status: 'active',
		notes: ''
	};

	let draft = $state<Draft>({ ...EMPTY });
	let error = $state('');
	let syncedKey = $state<string | null>(null);

	const taskLabel = $derived(
		draft.taskId === 'none'
			? 'No task'
			: (tasks.find((task) => task.id === draft.taskId)?.title ?? 'No task')
	);

	// Reset the draft when the dialog opens (or switches email) — never on a
	// parent re-render, so edits survive while the dialog is open.
	$effect(() => {
		const key = open ? (email?.id ?? 'new') : null;
		if (key === syncedKey) return;
		syncedKey = key;
		if (key === null) return;

		draft = email
			? {
					address: email.address,
					provider: email.provider ?? '',
					purpose: email.purpose ?? '',
					taskId: email.taskId ?? 'none',
					status: email.status,
					notes: email.notes ?? ''
				}
			: { ...EMPTY };
		error = '';
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{email ? 'Edit disposable email' : 'New disposable email'}</Dialog.Title>
			<Dialog.Description>
				{email ? 'Update this tracked address.' : 'Track a throwaway address used while testing.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/saveEmail"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						return;
					}

					await update();
					toast.success(email ? 'Email updated' : 'Email saved');
					open = false;
				}}
		>
			<input type="hidden" name="id" value={email?.id ?? ''} />
			<input type="hidden" name="taskId" value={draft.taskId === 'none' ? '' : draft.taskId} />
			<input type="hidden" name="status" value={draft.status} />

			<div class="space-y-1">
				<Label for="email-address">Address</Label>
				<Input
					id="email-address"
					name="address"
					bind:value={draft.address}
					placeholder="qa.probe.1234@mail.tm"
					aria-invalid={error !== ''}
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<Label for="email-provider">Provider</Label>
					<Input
						id="email-provider"
						name="provider"
						bind:value={draft.provider}
						list="email-providers"
						placeholder="mail.tm"
					/>
					<datalist id="email-providers">
						{#each providers as option (option)}
							<option value={option}></option>
						{/each}
					</datalist>
				</div>

				<div class="space-y-1">
					<Label for="email-status">Status</Label>
					<Select.Root
						type="single"
						value={draft.status}
						onValueChange={(value) => (draft.status = value as EmailStatus)}
					>
						<Select.Trigger id="email-status" class="w-full" aria-label="Status">
							{EMAIL_STATUS_META[draft.status].label}
						</Select.Trigger>
						<Select.Content>
							{#each EMAIL_STATUS_ORDER as option (option)}
								<Select.Item value={option} label={EMAIL_STATUS_META[option].label}>
									{EMAIL_STATUS_META[option].label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<div class="space-y-1">
				<Label for="email-purpose">Purpose</Label>
				<Input
					id="email-purpose"
					name="purpose"
					bind:value={draft.purpose}
					placeholder="Checkout retry verification"
				/>
			</div>

			<div class="space-y-1">
				<Label for="email-task">Linked task</Label>
				<Select.Root
					type="single"
					value={draft.taskId}
					onValueChange={(value) => (draft.taskId = value)}
				>
					<Select.Trigger id="email-task" class="w-full" aria-label="Linked task">
						{taskLabel}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="none" label="No task">No task</Select.Item>
						{#each tasks as task (task.id)}
							<Select.Item value={task.id} label={`${task.title} — ${task.project}`}>
								{task.title} — {task.project}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-1">
				<Label for="email-notes">Notes</Label>
				<Textarea
					id="email-notes"
					name="notes"
					bind:value={draft.notes}
					rows={3}
					placeholder="Anything worth remembering…"
				/>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="secondary" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={draft.address.trim() === ''}>
					{email ? 'Save' : 'Create email'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
