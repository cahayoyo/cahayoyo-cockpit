// Ambient types for markdown-it-task-lists (the package ships none).
declare module 'markdown-it-task-lists' {
	import type MarkdownIt from 'markdown-it';

	type TaskListOptions = {
		enabled?: boolean;
		label?: boolean;
		labelAfter?: boolean;
	};

	const plugin: (md: MarkdownIt, options?: TaskListOptions) => void;
	export default plugin;
}
