export type ParentCandidate = { id: string; parentId: string | null };

/**
 * One-level depth guard: the requested parent must exist (checked by the
 * caller), must not be the task itself, and must itself be a top-level task —
 * a subtask can never be a parent.
 */
export function canAssignParent(taskId: string | null, parent: ParentCandidate): boolean {
	return parent.id !== taskId && parent.parentId === null;
}
