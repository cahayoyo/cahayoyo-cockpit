<script lang="ts">
	// Create/edit dialog (final in every prototype variant): type-conditional
	// labels per grill decision 9, the shared password generator popover, tags as
	// a comma-separated draft (the server parses them). `secret`/`notes` are the
	// plaintext prefilled from the reveal endpoint; the same client-safe
	// vaultFormSchema gates the submit button and validates server-side.
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { failureMessage } from '$lib/forms.js';
	import { vaultFormSchema } from '$lib/vault/schemas.js';
	import { VAULT_TYPE_META } from '$lib/vault/presentation.js';
	import { VAULT_TYPES, type VaultEntryItem, type VaultType } from '$lib/vault/types.js';
	import PasswordGeneratorPopover from './PasswordGeneratorPopover.svelte';

	let {
		open = $bindable(false),
		entry = null,
		secret = '',
		notes = '',
		tags,
		onlocked,
		onsaved
	}: {
		open?: boolean;
		entry?: VaultEntryItem | null;
		secret?: string;
		notes?: string;
		tags: string[];
		onlocked?: () => void;
		onsaved?: () => void;
	} = $props();

	type Draft = {
		title: string;
		type: VaultType;
		username: string;
		secret: string;
		url: string;
		notes: string;
		tagsText: string;
	};

	const EMPTY: Draft = {
		title: '',
		type: 'login',
		username: '',
		secret: '',
		url: '',
		notes: '',
		tagsText: ''
	};

	let draft = $state<Draft>({ ...EMPTY });
	let error = $state('');
	let syncedKey = $state<string | null>(null);

	const meta = $derived(VAULT_TYPE_META[draft.type]);
	const secretPlaceholder = $derived(
		draft.type === 'login'
			? 'Account password'
			: draft.type === 'api_key'
				? 'API key value'
				: 'Write the note to keep encrypted'
	);
	// The same schema the server action validates with gates the submit button.
	const invalid = $derived(
		!vaultFormSchema.safeParse({
			title: draft.title,
			type: draft.type,
			username: draft.username,
			secret: draft.secret,
			url: draft.url,
			notes: draft.notes,
			tags: draft.tagsText
		}).success
	);

	// Reset the draft when the dialog opens (or switches entry) — never on a
	// parent re-render, so edits survive while the dialog is open.
	$effect(() => {
		const key = open ? (entry?.id ?? 'new') : null;
		if (key === syncedKey) return;
		syncedKey = key;
		if (key === null) return;

		draft = entry
			? {
					title: entry.title,
					type: entry.type,
					username: entry.username ?? '',
					secret,
					url: entry.url ?? '',
					notes,
					tagsText: entry.tags.join(', ')
				}
			: { ...EMPTY };
		error = '';
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{entry ? 'Edit entry' : 'New entry'}</Dialog.Title>
			<Dialog.Description>
				{entry ? 'Update this encrypted entry.' : 'Store a login, an API key or an encrypted note.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="space-y-4"
			method="post"
			action="?/saveEntry"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'failure') {
						error = failureMessage(result.data);
						// The idle window can lapse while the dialog is open.
						if (result.status === 401) onlocked?.();
						return;
					}

					await update();
					toast.success(entry ? 'Entry updated' : 'Entry saved');
					open = false;
					onsaved?.();
				}}
		>
			<input type="hidden" name="id" value={entry?.id ?? ''} />
			<input type="hidden" name="type" value={draft.type} />

			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<Label for="vault-title">Title</Label>
					<Input
						id="vault-title"
						name="title"
						bind:value={draft.title}
						placeholder="Neon console"
						aria-invalid={error !== ''}
					/>
				</div>

				<div class="space-y-1">
					<Label for="vault-type">Type</Label>
					<Select.Root
						type="single"
						value={draft.type}
						onValueChange={(value) => (draft.type = value as VaultType)}
					>
						<Select.Trigger id="vault-type" class="w-full" aria-label="Type">
							{meta.label}
						</Select.Trigger>
						<Select.Content>
							{#each VAULT_TYPES as option (option)}
								<Select.Item value={option} label={VAULT_TYPE_META[option].label}>
									{VAULT_TYPE_META[option].label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			{#if meta.usernameLabel}
				<div class="space-y-1">
					<Label for="vault-username">{meta.usernameLabel}</Label>
					<Input
						id="vault-username"
						name="username"
						bind:value={draft.username}
						placeholder={draft.type === 'api_key' ? 'r2-backup-writer' : 'owner@cahayoyo.dev'}
					/>
				</div>
			{/if}

			{#if draft.type === 'note'}
				<div class="space-y-1">
					<Label for="vault-note">{meta.secretLabel}</Label>
					<Textarea
						id="vault-note"
						name="secret"
						bind:value={draft.secret}
						rows={4}
						placeholder={secretPlaceholder}
					/>
				</div>
			{:else}
				<div class="flex items-end gap-2">
					<div class="min-w-0 flex-1 space-y-1">
						<Label for="vault-secret">{meta.secretLabel}</Label>
						<Input
							id="vault-secret"
							name="secret"
							bind:value={draft.secret}
							class="font-mono"
							placeholder={secretPlaceholder}
						/>
					</div>
					<PasswordGeneratorPopover onapply={(value) => (draft.secret = value)} />
				</div>
			{/if}

			{#if meta.urlLabel}
				<div class="space-y-1">
					<Label for="vault-url">{meta.urlLabel}</Label>
					<Input
						id="vault-url"
						name="url"
						bind:value={draft.url}
						placeholder="https://console.neon.tech"
					/>
				</div>
			{/if}

			<div class="space-y-1">
				<Label for="vault-notes">Notes</Label>
				<Textarea
					id="vault-notes"
					name="notes"
					bind:value={draft.notes}
					rows={2}
					placeholder="Anything worth remembering (encrypted)"
				/>
			</div>

			<div class="space-y-1">
				<Label for="vault-tags">Tags</Label>
				<Input
					id="vault-tags"
					name="tags"
					bind:value={draft.tagsText}
					list="vault-tag-options"
					placeholder="infra, database"
				/>
				<datalist id="vault-tag-options">
					{#each tags as tag (tag)}
						<option value={tag}></option>
					{/each}
				</datalist>
			</div>

			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="secondary" class="max-sm:h-11" onclick={() => (open = false)}
					>Cancel</Button
				>
				<Button type="submit" class="max-sm:h-11" disabled={invalid}>
					{entry ? 'Save' : 'Create entry'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
