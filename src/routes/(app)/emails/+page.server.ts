import { parseEmailSearch } from '$lib/emails/params';
import { emailActions } from '$lib/server/email-actions';
import { listEmailProviders, listEmails } from '$lib/server/emails';
import { requireUserId } from '$lib/server/session';
import { listProjects, listTasks } from '$lib/server/tasks';
import { ALL_TASKS } from '$lib/tasks/filters';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const ownerId = requireUserId(locals);
	// The full list loads once; the toolbar filters it client-side and the dialog
	// gets the distinct providers plus the tasks/projects for its select.
	const [items, providers, tasks, projects] = await Promise.all([
		listEmails(ownerId),
		listEmailProviders(ownerId),
		listTasks(ownerId, ALL_TASKS),
		listProjects(ownerId)
	]);

	return {
		filters: parseEmailSearch(url.searchParams),
		items,
		providers,
		tasks,
		projects
	};
};

export const actions: Actions = { ...emailActions };
