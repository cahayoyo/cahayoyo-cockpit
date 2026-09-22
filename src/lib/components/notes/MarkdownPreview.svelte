<script lang="ts">
	// Preview renderer (ADR-0003): markdown-it runs client-side only with `html: false`,
	// so raw HTML stays inert text and its link validation blocks javascript:/vbscript:/
	// file:/unsafe data: URLs — no sanitizer dependency.
	import MarkdownIt from 'markdown-it';
	import taskLists from 'markdown-it-task-lists';

	let { body }: { body: string } = $props();

	const md = new MarkdownIt({ html: false, linkify: true }).use(taskLists);
	const html = $derived(md.render(body));
</script>

<div class="md-preview text-sm">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- markdown-it with html:false (ADR-0003): raw HTML is escaped, links are protocol-validated -->
	{@html html}
</div>

<style>
	.md-preview :global(h1) {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.3;
	}
	.md-preview :global(h2) {
		margin: 1.25rem 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.4;
	}
	.md-preview :global(h3) {
		margin: 1rem 0 0.5rem;
		font-size: 1.05rem;
		font-weight: 600;
		line-height: 1.4;
	}
	.md-preview :global(p) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}
	.md-preview :global(ul),
	.md-preview :global(ol) {
		margin: 0.5rem 0;
		padding-left: 1.25rem;
	}
	.md-preview :global(ul) {
		list-style: disc;
	}
	.md-preview :global(ol) {
		list-style: decimal;
	}
	.md-preview :global(li) {
		margin: 0.15rem 0;
	}
	.md-preview :global(li.task-list-item) {
		list-style: none;
		margin-left: -1.1rem;
	}
	.md-preview :global(a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.md-preview :global(code) {
		background: var(--muted);
		border-radius: var(--radius-sm);
		padding: 0.1rem 0.3rem;
		font-size: 0.85em;
	}
	.md-preview :global(pre) {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		margin: 0.75rem 0;
		overflow-x: auto;
		padding: 0.75rem;
	}
	.md-preview :global(pre code) {
		background: transparent;
		padding: 0;
	}
	.md-preview :global(blockquote) {
		border-left: 3px solid var(--border);
		color: var(--muted-foreground);
		margin: 0.75rem 0;
		padding-left: 0.75rem;
	}
	.md-preview :global(table) {
		border-collapse: collapse;
		font-size: 0.875rem;
		margin: 0.75rem 0;
		width: 100%;
	}
	.md-preview :global(th),
	.md-preview :global(td) {
		border: 1px solid var(--border);
		padding: 0.35rem 0.5rem;
		text-align: left;
	}
	.md-preview :global(th) {
		background: var(--muted);
		font-weight: 500;
	}
	.md-preview :global(hr) {
		border: 0;
		border-top: 1px solid var(--border);
		margin: 1rem 0;
	}
	.md-preview :global(img) {
		border-radius: var(--radius-md);
		max-width: 100%;
	}
	.md-preview :global(input[type='checkbox']) {
		accent-color: var(--primary);
		margin-right: 0.4rem;
	}
</style>
