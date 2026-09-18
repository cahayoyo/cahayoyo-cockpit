<script lang="ts">
	import CopyButton from './CopyButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { formatJson, minifyJson, type JsonError } from '$lib/toolkit/json-tool.js';

	type JsonAction = 'format' | 'minify' | 'validate';

	let input = $state('');
	let output = $state('');
	let message = $state('');
	let messageIsError = $state(false);

	function run(action: JsonAction): void {
		const result = action === 'minify' ? minifyJson(input) : formatJson(input);

		if (!result.ok) {
			output = '';
			messageIsError = true;
			message = describeError(result);
			return;
		}

		if (action === 'validate') {
			output = '';
			messageIsError = false;
			message = 'Valid JSON.';
			return;
		}

		output = result.output;
		messageIsError = false;
		message = action === 'format' ? 'Formatted with 2-space indent.' : 'Minified.';
	}

	function describeError(error: JsonError): string {
		return error.line === null
			? error.message
			: `${error.message} (line ${error.line}, column ${error.column})`;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>JSON formatter</CardTitle>
		<CardDescription>Format, minify and validate JSON (no key sorting).</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2">
			<p class="text-sm font-medium">Input</p>
			<Textarea
				bind:value={input}
				class="min-h-40 font-mono text-sm"
				placeholder="Paste JSON here — an object or an array…"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Button variant="secondary" onclick={() => run('format')}>Format</Button>
			<Button variant="secondary" onclick={() => run('minify')}>Minify</Button>
			<Button variant="outline" onclick={() => run('validate')}>Validate</Button>
		</div>

		{#if message !== ''}
			<p class={messageIsError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
				{message}
			</p>
		{/if}

		{#if output !== ''}
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium">Output</p>
					<CopyButton value={output} label="JSON copied" />
				</div>
				<Textarea
					readonly
					value={output}
					class="min-h-40 font-mono text-sm"
					aria-label="JSON output"
				/>
			</div>
		{/if}
	</CardContent>
</Card>
