export type ParentCandidate = { id: string; parentId: string | null };

/**
 * One-level depth guard: the requested parent must exist (checked by the
 * caller), must not be the task itself, and must itself be a top-level task —
 * a subtask can never be a parent.
 */
export function canAssignParent(taskId: string | null, parent: ParentCandidate): boolean {
	return parent.id !== taskId && parent.parentId === null;
}

/** Groups tasks by parent id; top-level tasks are not part of the map. */
export function groupByParent<T extends { parentId: string | null }>(
	tasks: readonly T[]
): Map<string, T[]> {
	const map = new Map<string, T[]>();

	for (const task of tasks) {
		if (task.parentId === null) continue;
		const children = map.get(task.parentId);
		if (children) {
			children.push(task);
		} else {
			map.set(task.parentId, [task]);
		}
	}

	return map;
}

/** Parent progress (`2/5`) over the given subtask list. */
export function subtaskProgress(children: readonly { status: string }[]): {
	done: number;
	total: number;
} {
	return {
		done: children.filter((child) => child.status === 'done').length,
		total: children.length
	};
}
