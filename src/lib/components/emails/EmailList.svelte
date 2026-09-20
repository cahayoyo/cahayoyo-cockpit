<script lang="ts">
	// Email list: sections grouped by status, two-line rows (address prominent,
	// meta below). Row actions: inline copy, address opens the editor, kebab menu.
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { EMAIL_STATUS_META, EMAIL_STATUS_ORDER } from '$lib/emails/presentation.js';
	import type { EmailItem } from '$lib/emails/types.js';
	import { dateInAppZone } from '$lib/tasks/today.js';
	import EmailMenu from './EmailMenu.svelte';
	import type { EmailRow } from './types.js';

	let {
		emails,
		onedit,
		ontoggle,
		ondelete
	}: {
		emails: EmailRow[];
		onedit: (email: EmailItem) => void;
		ontoggle: (email: EmailItem) => void;
		ondelete: (email: EmailItem) => void;
	} = $props();

	const groups = $derived(
		EMAIL_STATUS_ORDER.map((status) => ({
			status,
			label: EMAIL_STATUS_META[status].label,
			emails: emails.filter((email) => email.status === status)
		})).filter((group) => group.emails.length > 0)
	);
</script>

{#snippet row(email: EmailRow)}
	<div class="relative flex flex-col gap-1 px-3 py-2.5">
		<div class="flex min-w-0 items-center gap-1">
			<button
				type="button"
				class="min-w-0 max-w-full truncate text-left text-sm font-medium hover:underline max-lg:min-h-11"
				onclick={() => onedit(email)}
			>
				{email.address}
			</button>
			<CopyButton value={email.address} label="Address copied" class="relative z-10 shrink-0" />
			<div class="ml-auto">
				<EmailMenu {email} {onedit} {ontoggle} {ondelete} />
			</div>
		</div>
		<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
			{#if email.provider}
				<span class="truncate">{email.provider}</span>
				<span aria-hidden="true">·</span>
			{/if}
			<Badge variant="outline" class={EMAIL_STATUS_META[email.status].badge}>
				{EMAIL_STATUS_META[email.status].label}
			</Badge>
			{#if email.purpose}
				<span class="truncate">{email.purpose}</span>
			{/if}
			{#if email.taskId}
				<a
					href={resolve(`/tasks?task=${email.taskId}`)}
					class="truncate text-foreground hover:underline"
				>
					{email.taskTitle}
				</a>
			{/if}
			<span class="ml-auto shrink-0 tabular-nums">{dateInAppZone(email.createdAt)}</span>
		</div>
	</div>
{/snippet}

<div class="space-y-6">
	{#each groups as group (group.status)}
		<section class="space-y-2">
			<h2 class="text-xs font-medium text-muted-foreground">
				{group.label}
				<span class="tabular-nums">· {group.emails.length}</span>
			</h2>
			<div
				class="divide-y divide-border overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10"
			>
				{#each group.emails as email (email.id)}
					{@render row(email)}
				{/each}
			</div>
		</section>
	{/each}
</div>
