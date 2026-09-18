<script lang="ts">
	// Kanban board for one project: one dndzone per status (svelte-dnd-action),
	// status dot + count column headers, cards with priority badge, due date,
	// subtask progress and tags. Subtasks are never board cards.
	//
	// Moves are optimistic: the zone updates locally, the server action runs on
	// finalize, and every server refresh re-syncs the zones from the task list —
	// which is also the rollback when a move fails.
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import { untrack } from 'svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { toast } from 'svelte-sonner';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { submitAction } from '$lib/forms.js';
	import {
		PRIORITY_META,
		STATUS_META,
		STATUS_ORDER,
		type TaskStatus
	} from '$lib/tasks/presentation.js';
	import { cn } from '$lib/utils.js';
	import type { TaskItem, TaskProgress } from './types.js';

	type Zone = { status: TaskStatus; items: TaskItem[] };

	let {
		tasks,
		projectId,
		today,
		progressOf,
		onopen,
		ondelete
	}: {
		tasks: TaskItem[];
		projectId: string;
		today: string;
		progressOf: (id: string) => TaskProgress;
		onopen: (task: TaskItem) => void;
		ondelete: (task: TaskItem) => void;
	} = $props();

	// Local copies keep the board independent from the prop rows; re-syncing
	// rebuilds them from the last server truth (no prop mutation on failure).
	function buildZones(list: TaskItem[], projectId: string): Zone[] {
		const zones = STATUS_ORDER.map((status) => ({ status, items: [] as TaskItem[] }));
		const byStatus = new Map(zones.map((zone) => [zone.status, zone]));

		for (const task of list) {
			if (task.parentId !== null || task.projectId !== projectId) continue;
			byStatus.get(task.status)?.items.push({ ...task });
		}

		return zones;
	}

	// Snapshot for the initial (SSR) render; the effect below re-syncs after
	// every server refresh — that is also the rollback path when a move fails.
	// The board must stay writable for drag previews, so a plain `$derived`
	// cannot express it.
	// eslint-disable-next-line svelte/prefer-writable-derived
	let zones = $state(untrack(() => buildZones(tasks, projectId)));

	$effect(() => {
		zones = buildZones(tasks, projectId);
	});

	function consider(zone: Zone, detail: DndEvent<TaskItem>): void {
		zone.items = detail.items;
	}

	async function setStatus(taskId: string, status: TaskStatus): Promise<boolean> {
		const outcome = await submitAction('?/setTaskStatus', { id: taskId, status });
		if (!outcome.ok) {
			toast.error(outcome.message);
			return false;
		}

		return true;
	}

	async function finalize(zone: Zone, detail: DndEvent<TaskItem>): Promise<void> {
		zone.items = detail.items;

		for (const task of detail.items) {
			if (task.status === zone.status) continue;
			task.status = zone.status;
			if (!(await setStatus(task.id, zone.status))) {
				zones = buildZones(tasks, projectId);
			}
		}
	}
</script>

<div class="flex gap-3 overflow-x-auto pb-2">
	{#each zones as zone (zone.status)}
		<section class="flex w-72 shrink-0 snap-start flex-col rounded-xl border bg-muted/30">
			<header class="flex items-center justify-between border-b px-3 py-2">
				<h2 class="flex items-center gap-2 text-sm font-medium">
					<span class={cn('size-2 rounded-full', STATUS_META[zone.status].dot)}></span>
					{STATUS_META[zone.status].label}
				</h2>
				<span class="text-xs text-muted-foreground">{zone.items.length}</span>
			</header>

			<div
				class="flex min-h-28 flex-1 flex-col gap-2 p-2"
				use:dndzone={{
					items: zone.items,
					type: 'task-card',
					flipDurationMs: 150,
					delayTouchStart: 150
				}}
				onconsider={(event: CustomEvent<DndEvent<TaskItem>>) => consider(zone, event.detail)}
				onfinalize={(event: CustomEvent<DndEvent<TaskItem>>) => void finalize(zone, event.detail)}
			>
				{#each zone.items as task (task.id)}
					{@const progress = progressOf(task.id)}
					{@const overdue = task.dueDate !== null && task.dueDate < today && task.status !== 'done'}
					<div
						class="relative rounded-lg border bg-card p-2.5 shadow-xs transition-colors hover:border-ring/60"
					>
						<div class="flex items-start justify-between gap-1">
							<button
								type="button"
								class="text-left text-sm font-medium after:absolute after:inset-0"
								onclick={() => onopen(task)}
							>
								{task.title || 'Untitled'}
							</button>

							<div class="relative z-10">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button
												variant="ghost"
												size="icon-sm"
												class="shrink-0 max-lg:size-11"
												aria-label="Task actions"
												{...props}
											>
												<EllipsisVertical class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Sub>
											<DropdownMenu.SubTrigger>Move to</DropdownMenu.SubTrigger>
											<DropdownMenu.SubContent>
												{#each STATUS_ORDER as option (option)}
													<DropdownMenu.Item
														disabled={option === task.status}
														onSelect={() => void setStatus(task.id, option)}
													>
														{STATUS_META[option].label}
													</DropdownMenu.Item>
												{/each}
											</DropdownMenu.SubContent>
										</DropdownMenu.Sub>
										<DropdownMenu.Separator />
										<DropdownMenu.Item variant="destructive" onSelect={() => ondelete(task)}>
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>

						<div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							<Badge variant="outline" class={PRIORITY_META[task.priority].badge}>
								{PRIORITY_META[task.priority].label}
							</Badge>
							{#if task.dueDate}
								<span class={cn(overdue && 'font-medium text-destructive')}>{task.dueDate}</span>
							{/if}
							{#if progress.total > 0}
								<span>{progress.done}/{progress.total}</span>
							{/if}
							{#each task.tags.slice(0, 2) as tag (tag)}
								<Badge variant="secondary">{tag}</Badge>
							{/each}
							{#if task.tags.length > 2}
								<span>+{task.tags.length - 2}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
</div>
