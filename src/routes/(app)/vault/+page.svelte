<script lang="ts">
	// Vault page: Rows | Table list (`?view=` URL-backed, remembered per browser),
	// masked secrets revealed through the no-store POST endpoint, and the gated
	// unlock flow (grill decisions 2, 4, 12–14, 19). The route load carries
	// metadata only — plaintext arrives from `/vault/reveal` and never from SSR.
	import Lock from '@lucide/svelte/icons/lock';
	import LockOpen from '@lucide/svelte/icons/lock-open';
	import SearchX from '@lucide/svelte/icons/search-x';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { z } from 'zod';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import UnlockDialog from '$lib/components/vault/UnlockDialog.svelte';
	import VaultDialog from '$lib/components/vault/VaultDialog.svelte';
	import VaultListDense from '$lib/components/vault/VaultListDense.svelte';
	import VaultTable from '$lib/components/vault/VaultTable.svelte';
	import VaultToolbar from '$lib/components/vault/VaultToolbar.svelte';
	import { submitAction } from '$lib/forms.js';
	import {
		buildVaultSearch,
		filterVaultEntries,
		parseVaultSearch,
		VAULT_TYPE_FILTERS
	} from '$lib/vault/params.js';
	import type { VaultEntryItem, VaultFilterPatch, VaultView } from '$lib/vault/types.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	// Owner verdict 19: the toggle survives reloads per browser.
	const VIEW_STORAGE_KEY = 'vault-view';

	type RevealFailure = {
		ok: false;
		reason: 'locked' | 'missing' | 'undecryptable' | 'invalid' | 'error';
		message: string;
	};
	type RevealSuccess = { ok: true; secret: string; notes: string | null };
	type RevealOutcome = RevealSuccess | RevealFailure;

	// The reveal wire is a trust boundary: parse it instead of asserting the shape.
	const revealSuccessSchema = z.object({
		ok: z.literal(true),
		secret: z.string(),
		notes: z.string().nullable()
	});
	const revealFailureSchema = z.object({
		ok: z.literal(false),
		reason: z.enum(['locked', 'missing', 'undecryptable', 'invalid', 'error']).catch('error'),
		message: z.string()
	});

	const filters = $derived(parseVaultSearch(page.url.searchParams));
	const view = $derived(filters.view);
	const visible = $derived(filterVaultEntries(data.entries, filters));
	const loading = $derived(navigating.to !== null);
	const filtersActive = $derived(filters.q.trim() !== '' || filters.type !== 'all');

	// `data.unlocked` is the server truth; a 401 from a gated request flips the
	// UI to locked on the spot (grill decision 13), until the next unlock.
	let forcedLocked = $state(false);
	const locked = $derived(!data.unlocked || forcedLocked);

	let revealed = new SvelteSet<string>();
	let secrets = $state<Record<string, string>>({});
	let revealErrors = $state<Record<string, string>>({});
	let decryptFailed = new SvelteSet<string>();
	let unlockOpen = $state(false);
	let pending = $state<(() => void | Promise<void>) | null>(null);

	let editorOpen = $state(false);
	let editing = $state<VaultEntryItem | null>(null);
	let editSecret = $state('');
	let editNotes = $state('');
	let confirmOpen = $state(false);
	let deleteTarget = $state<VaultEntryItem | null>(null);

	// Locked means every cached plaintext is stale: drop it (the banner is driven
	// by `locked` itself).
	function lockDown(): void {
		forcedLocked = true;
		revealed.clear();
		decryptFailed.clear();
		secrets = {};
		revealErrors = {};
	}

	function forget(id: string): void {
		revealed.delete(id);
		decryptFailed.delete(id);
		delete secrets[id];
		delete revealErrors[id];
	}

	// Gated actions (grill decisions 2 and 12): while locked they open the unlock
	// dialog and resume automatically on success.
	function gated(action: () => void | Promise<void>): void {
		if (!locked) {
			void action();
			return;
		}

		pending = action;
		unlockOpen = true;
	}

	function unlock(): void {
		forcedLocked = false;
		const action = pending;
		pending = null;
		void action?.();
	}

	// Closing the dialog without unlocking drops the pending action.
	$effect(() => {
		if (!unlockOpen) pending = null;
	});

	async function fetchSecret(id: string): Promise<RevealOutcome> {
		const body = new FormData();
		body.append('id', id);

		try {
			const response = await fetch(resolve('/vault/reveal'), { method: 'POST', body });
			const payload: unknown = await response.json();

			const success = revealSuccessSchema.safeParse(payload);
			if (success.success) {
				return success.data;
			}

			const failure = revealFailureSchema.safeParse(payload);
			if (failure.success) {
				return failure.data;
			}
		} catch {
			// Fall through to the generic failure below.
		}

		return { ok: false, reason: 'error', message: 'Something went wrong.' };
	}

	function revealFailed(
		entry: VaultEntryItem,
		failure: RevealFailure,
		retry: () => void | Promise<void>
	): void {
		if (failure.reason === 'locked') {
			lockDown();
			pending = retry;
			unlockOpen = true;
			return;
		}

		if (failure.reason === 'undecryptable') {
			decryptFailed.add(entry.id);
		}

		if (failure.reason === 'missing') {
			toast.error(failure.message);
			void invalidateAll();
			return;
		}

		revealErrors[entry.id] = failure.message;
	}

	function reveal(entry: VaultEntryItem): void {
		gated(() => doReveal(entry));
	}

	async function doReveal(entry: VaultEntryItem): Promise<void> {
		if (revealed.has(entry.id)) {
			revealed.delete(entry.id);
			return;
		}

		const result = await fetchSecret(entry.id);
		if (!result.ok) {
			revealFailed(entry, result, () => doReveal(entry));
			return;
		}

		secrets[entry.id] = result.secret;
		delete revealErrors[entry.id];
		revealed.add(entry.id);
	}

	function copySecret(entry: VaultEntryItem): void {
		gated(() => doCopySecret(entry));
	}

	async function doCopySecret(entry: VaultEntryItem): Promise<void> {
		// Always go through the server: copying is a vault action, so it must
		// re-check the lock and refresh the idle window (grill decisions 2/4).
		const result = await fetchSecret(entry.id);
		if (!result.ok) {
			revealFailed(entry, result, () => doCopySecret(entry));
			return;
		}

		secrets[entry.id] = result.secret;
		delete revealErrors[entry.id];

		try {
			await navigator.clipboard.writeText(result.secret);
			toast.success('Password copied');
		} catch {
			toast.error('Could not copy to the clipboard.');
		}
	}

	function openNew(): void {
		gated(() => {
			editing = null;
			editSecret = '';
			editNotes = '';
			editorOpen = true;
		});
	}

	function openEdit(entry: VaultEntryItem): void {
		gated(() => doOpenEdit(entry));
	}

	async function doOpenEdit(entry: VaultEntryItem): Promise<void> {
		// Prefilling the editor is itself a reveal; the plaintext never rides in
		// the list payload.
		const result = await fetchSecret(entry.id);
		if (!result.ok) {
			if (result.reason === 'undecryptable') {
				// Still editable (grill decision 17): retyping the secret overwrites it.
				decryptFailed.add(entry.id);
				revealErrors[entry.id] = result.message;
				editing = entry;
				editSecret = '';
				editNotes = '';
				editorOpen = true;
				return;
			}

			revealFailed(entry, result, () => doOpenEdit(entry));
			return;
		}

		decryptFailed.delete(entry.id);
		editing = entry;
		editSecret = result.secret;
		editNotes = result.notes ?? '';
		editorOpen = true;
	}

	function askDelete(entry: VaultEntryItem): void {
		deleteTarget = entry;
		confirmOpen = true;
	}

	async function lockNow(): Promise<void> {
		lockDown();
		const outcome = await submitAction('?/lockVault', {});
		if (!outcome.ok) {
			toast.error(outcome.message);
		}
	}

	function navigate(query: string): void {
		void goto(resolve(query ? `/vault?${query}` : '/vault'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function applyFilters(patch: VaultFilterPatch): void {
		// Omitted keys keep their current value.
		const type = VAULT_TYPE_FILTERS.find((value) => value === patch.type) ?? filters.type;
		navigate(buildVaultSearch({ q: patch.q ?? filters.q, type, view }));
	}

	function setView(next: VaultView): void {
		localStorage.setItem(VIEW_STORAGE_KEY, next);
		navigate(buildVaultSearch({ q: filters.q, type: filters.type, view: next }));
	}

	// Restore the remembered view on the first load when the URL does not pin one.
	onMount(() => {
		if (page.url.searchParams.has('view')) return;
		if (localStorage.getItem(VIEW_STORAGE_KEY) === 'table') setView('table');
	});
</script>

<div class="flex flex-wrap items-center gap-2">
	<Badge variant={locked ? 'secondary' : 'outline'} class="gap-1">
		{#if locked}
			<Lock class="size-3" />
		{:else}
			<LockOpen class="size-3" />
		{/if}
		{locked ? 'Locked' : 'Unlocked'}
	</Badge>
	<Button
		variant="ghost"
		size="sm"
		class="max-sm:h-11"
		disabled={locked}
		aria-label="Lock the vault now"
		onclick={lockNow}
	>
		<Lock class="size-4" />
		Lock now
	</Button>
</div>

{#if locked}
	<div
		class="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm"
		role="status"
	>
		<Lock class="size-4 shrink-0 text-muted-foreground" />
		<span>Vault locked — unlock to reveal or edit entries.</span>
		<Button variant="outline" size="sm" class="max-sm:h-11" onclick={() => (unlockOpen = true)}>
			Unlock
		</Button>
	</div>
{/if}

<VaultToolbar
	q={filters.q}
	type={filters.type}
	{view}
	count={visible.length}
	onfilter={applyFilters}
	onview={setView}
	onnew={openNew}
/>

{#if loading}
	<div class="space-y-2" aria-busy="true">
		{#each [0, 1, 2, 3, 4] as key (key)}
			<Skeleton class="h-14 w-full rounded-xl" />
		{/each}
	</div>
{:else if visible.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
	>
		{#if filtersActive}
			<SearchX class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No vault entries match these filters.</p>
			<Button
				variant="outline"
				size="sm"
				class="max-sm:h-11"
				onclick={() => applyFilters({ q: '', type: 'all' })}
			>
				Clear filters
			</Button>
		{:else}
			<Lock class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No vault entries yet.</p>
			<Button variant="outline" size="sm" class="max-sm:h-11" onclick={openNew}>New entry</Button>
		{/if}
	</div>
{:else if view === 'table'}
	<VaultTable
		entries={visible}
		{revealed}
		{secrets}
		{revealErrors}
		{decryptFailed}
		onedit={openEdit}
		onreveal={reveal}
		oncopy={copySecret}
		ondelete={askDelete}
	/>
{:else}
	<VaultListDense
		entries={visible}
		{revealed}
		{secrets}
		{revealErrors}
		{decryptFailed}
		onedit={openEdit}
		onreveal={reveal}
		oncopy={copySecret}
		ondelete={askDelete}
	/>
{/if}

<VaultDialog
	bind:open={editorOpen}
	entry={editing}
	secret={editSecret}
	notes={editNotes}
	tags={data.tags}
	onlocked={lockDown}
	onsaved={() => {
		if (editing) forget(editing.id);
	}}
/>

<UnlockDialog bind:open={unlockOpen} onunlock={unlock} />

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete entry"
	description={deleteTarget ? `"${deleteTarget.title}" will be deleted.` : ''}
	confirmLabel="Delete entry"
	action="?/deleteEntry"
	fields={deleteTarget ? { id: deleteTarget.id } : {}}
	successMessage="Entry deleted"
	onsuccess={() => {
		if (deleteTarget) forget(deleteTarget.id);
		deleteTarget = null;
	}}
/>
