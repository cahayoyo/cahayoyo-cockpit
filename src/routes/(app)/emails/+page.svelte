<script lang="ts">
	// Emails page: grouped Active | Dead list (accepted Phase 9 design) wired to
	// the emails server layer. The URL owns the filters (`q`, `status`,
	// `provider`, Active by default); the list filters client-side over the full
	// load so the toolbar reacts without a server round-trip.
	import Mail from '@lucide/svelte/icons/mail';
	import SearchX from '@lucide/svelte/icons/search-x';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EmailDialog from '$lib/components/emails/EmailDialog.svelte';
	import EmailList from '$lib/components/emails/EmailList.svelte';
	import EmailToolbar from '$lib/components/emails/EmailToolbar.svelte';
	import type { EmailTaskOption } from '$lib/components/emails/types.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { EMAIL_STATUS_FILTERS, filterEmails } from '$lib/emails/filters.js';
	import { buildEmailSearch } from '$lib/emails/params.js';
	import { PROVIDER_SUGGESTIONS } from '$lib/emails/presentation.js';
	import type { EmailFilterPatch, EmailItem } from '$lib/emails/types.js';
	import { submitAction } from '$lib/forms.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	let dialogOpen = $state(false);
	let editing = $state<EmailItem | null>(null);
	let deleteTarget = $state<EmailItem | null>(null);
	let confirmOpen = $state(false);

	const loading = $derived(navigating.to !== null);
	const items = $derived(filterEmails(data.items, data.filters));
	const providerSuggestions = $derived([...new Set([...PROVIDER_SUGGESTIONS, ...data.providers])]);
	const taskOptions = $derived.by<EmailTaskOption[]>(() => {
		const projectNames = new Map(data.projects.map((project) => [project.id, project.name]));
		// The linked task stays selectable while editing even when it has since
		// become done, so the select never shows "No task" over a kept link.
		const linkedId = editing?.taskId ?? null;

		return data.tasks
			.filter((task) => task.status !== 'done' || task.id === linkedId)
			.map((task) => ({
				id: task.id,
				title: task.title,
				project: projectNames.get(task.projectId) ?? ''
			}));
	});
	const filtersActive = $derived(
		data.filters.q.trim() !== '' ||
			data.filters.status !== 'active' ||
			data.filters.provider !== null
	);

	function applyFilters(patch: EmailFilterPatch): void {
		// Omitted keys keep their current value; `null` clears the filter.
		const status =
			EMAIL_STATUS_FILTERS.find((value) => value === patch.status) ?? data.filters.status;
		const query = buildEmailSearch({
			q: patch.q ?? data.filters.q,
			status,
			provider: patch.provider === undefined ? data.filters.provider : patch.provider
		});

		void goto(resolve(query ? `/emails?${query}` : '/emails'), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function openNew(): void {
		editing = null;
		dialogOpen = true;
	}

	function openEdit(email: EmailItem): void {
		editing = email;
		dialogOpen = true;
	}

	async function toggleStatus(email: EmailItem): Promise<void> {
		const outcome = await submitAction('?/setEmailStatus', {
			id: email.id,
			status: email.status === 'active' ? 'dead' : 'active'
		});
		if (!outcome.ok) toast.error(outcome.message);
	}

	function askDelete(email: EmailItem): void {
		deleteTarget = email;
		confirmOpen = true;
	}
</script>

<EmailToolbar
	q={data.filters.q}
	status={data.filters.status}
	provider={data.filters.provider}
	providers={data.providers}
	count={items.length}
	onfilter={applyFilters}
	onnew={openNew}
/>

{#if loading}
	<div class="space-y-2" aria-busy="true">
		{#each [0, 1, 2, 3, 4] as key (key)}
			<Skeleton class="h-14 w-full rounded-xl" />
		{/each}
	</div>
{:else if items.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
	>
		{#if filtersActive}
			<SearchX class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No disposable emails match these filters.</p>
			<Button
				variant="outline"
				size="sm"
				onclick={() => applyFilters({ q: '', status: 'active', provider: null })}
			>
				Clear filters
			</Button>
		{:else}
			<Mail class="size-6 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No disposable emails yet.</p>
			<Button variant="outline" size="sm" onclick={openNew}>New email</Button>
		{/if}
	</div>
{:else}
	<EmailList emails={items} onedit={openEdit} ontoggle={toggleStatus} ondelete={askDelete} />
{/if}

<EmailDialog
	bind:open={dialogOpen}
	email={editing}
	tasks={taskOptions}
	providers={providerSuggestions}
/>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Delete email"
	description={deleteTarget ? `"${deleteTarget.address}" will be deleted.` : ''}
	confirmLabel="Delete email"
	action="?/deleteEmail"
	fields={deleteTarget ? { id: deleteTarget.id } : {}}
	successMessage="Email deleted"
	onsuccess={() => (deleteTarget = null)}
/>
