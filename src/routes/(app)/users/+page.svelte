<script lang="ts">
	// Users page (#89): the super admin lists accounts and creates, deactivates/
	// reactivates, or resets their passwords. Every mutation runs through the
	// shared super-admin actions; the load above refuses non-admins server-side.
	import UsersIcon from '@lucide/svelte/icons/users';
	import { navigating } from '$app/state';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import CreateUserDialog from '$lib/components/users/CreateUserDialog.svelte';
	import ResetPasswordDialog from '$lib/components/users/ResetPasswordDialog.svelte';
	import UserMenu from '$lib/components/users/UserMenu.svelte';
	import { dateInAppZone } from '$lib/tasks/today.js';
	import { roleLabel, statusLabel, statusVariant } from '$lib/users/presentation.js';
	import type { AccountListItem } from '$lib/users/types.js';
	import type { PageProps } from './$types.js';

	let { data }: PageProps = $props();

	const loading = $derived(navigating.to !== null);

	let createOpen = $state(false);
	let resetOpen = $state(false);
	let resetTarget = $state<AccountListItem | null>(null);

	let toggleOpen = $state(false);
	let toggleTarget = $state<AccountListItem | null>(null);

	function askReset(account: AccountListItem): void {
		resetTarget = account;
		resetOpen = true;
	}

	function askToggle(account: AccountListItem): void {
		toggleTarget = account;
		toggleOpen = true;
	}

	// The row menu picks the intent; the confirm dialog posts the change.
	const toggleLabel = $derived(toggleTarget?.banned ? 'Reactivate' : 'Deactivate');
	const toggleDescription = $derived(
		toggleTarget
			? toggleTarget.banned
				? `"${toggleTarget.email}" will be able to sign in again.`
				: `"${toggleTarget.email}" will be signed out and blocked from signing in. Its data is kept.`
			: ''
	);
	const toggleSuccess = $derived(
		toggleTarget?.banned ? 'Account reactivated' : 'Account deactivated'
	);
</script>

<div class="flex flex-wrap items-center justify-between gap-2">
	<p class="text-sm text-muted-foreground tabular-nums">
		{data.users.length}
		{data.users.length === 1 ? 'account' : 'accounts'}
	</p>
	<Button class="max-sm:h-11" onclick={() => (createOpen = true)}>New account</Button>
</div>

{#if loading}
	<div class="space-y-2" aria-busy="true">
		{#each [0, 1, 2, 3, 4] as key (key)}
			<Skeleton class="h-14 w-full rounded-xl" />
		{/each}
	</div>
{:else if data.users.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center"
	>
		<UsersIcon class="size-6 text-muted-foreground" />
		<p class="text-sm text-muted-foreground">No accounts yet.</p>
		<Button variant="outline" size="sm" class="max-sm:h-11" onclick={() => (createOpen = true)}>
			New account
		</Button>
	</div>
{:else}
	<div class="overflow-x-auto rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-border text-left text-muted-foreground">
					<th class="px-3 py-2 font-medium">Email</th>
					<th class="px-3 py-2 font-medium">Name</th>
					<th class="px-3 py-2 font-medium">Role</th>
					<th class="px-3 py-2 font-medium">Status</th>
					<th class="px-3 py-2 text-right font-medium">Created</th>
					<th class="px-3 py-2"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as account (account.id)}
					<tr class="border-b border-border last:border-0 hover:bg-muted/50">
						<td class="px-3 py-2 font-medium">{account.email}</td>
						<td class="px-3 py-2 text-muted-foreground">{account.name}</td>
						<td class="px-3 py-2">
							<Badge variant="outline">{roleLabel(account.role)}</Badge>
						</td>
						<td class="px-3 py-2">
							<Badge variant={statusVariant(account.banned)}>{statusLabel(account.banned)}</Badge>
						</td>
						<td class="px-3 py-2 text-right whitespace-nowrap tabular-nums text-muted-foreground">
							{dateInAppZone(account.createdAt)}
						</td>
						<td class="px-3 py-2">
							<div class="flex justify-end">
								<UserMenu {account} onreset={askReset} ontoggle={askToggle} />
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<CreateUserDialog bind:open={createOpen} />

<ResetPasswordDialog bind:open={resetOpen} account={resetTarget} />

<ConfirmDialog
	bind:open={toggleOpen}
	title={`${toggleLabel} account`}
	description={toggleDescription}
	confirmLabel={toggleLabel}
	action="?/setUserActive"
	fields={toggleTarget
		? { userId: toggleTarget.id, active: toggleTarget.banned ? 'true' : 'false' }
		: {}}
	variant={toggleTarget?.banned ? 'secondary' : 'destructive'}
	successMessage={toggleSuccess}
	onsuccess={() => (toggleTarget = null)}
/>
