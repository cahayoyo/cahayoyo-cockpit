<script lang="ts">
	// QA Toolkit: 4 client-side tools in one tabbed page. Local state only —
	// no URL params, no localStorage, no server calls.
	import Braces from '@lucide/svelte/icons/braces';
	import Calculator from '@lucide/svelte/icons/calculator';
	import Dices from '@lucide/svelte/icons/dices';
	import Users from '@lucide/svelte/icons/users';
	import type { Component } from 'svelte';
	import CounterPanel from '$lib/components/toolkit/CounterPanel.svelte';
	import JsonPanel from '$lib/components/toolkit/JsonPanel.svelte';
	import StringGeneratorPanel from '$lib/components/toolkit/StringGeneratorPanel.svelte';
	import TestDataPanel from '$lib/components/toolkit/TestDataPanel.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	type Tool = { value: string; label: string; icon: Component };

	const TOOLS: Tool[] = [
		{ value: 'string-generator', label: 'String generator', icon: Dices },
		{ value: 'counter', label: 'Counter', icon: Calculator },
		{ value: 'test-data', label: 'Test data', icon: Users },
		{ value: 'json', label: 'JSON', icon: Braces }
	];

	let active = $state('string-generator');
</script>

<Tabs.Root bind:value={active}>
	<Tabs.List
		class="border-border h-auto w-full flex-nowrap justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0"
	>
		{#each TOOLS as tool (tool.value)}
			<Tabs.Trigger
				value={tool.value}
				class="data-[state=active]:border-primary data-[state=active]:text-foreground h-9 flex-none gap-2 rounded-none border-b-2 border-transparent px-3 data-[state=active]:bg-transparent"
			>
				<tool.icon class="size-4" />
				{tool.label}
			</Tabs.Trigger>
		{/each}
	</Tabs.List>

	<Tabs.Content value="string-generator"><StringGeneratorPanel /></Tabs.Content>
	<Tabs.Content value="counter"><CounterPanel /></Tabs.Content>
	<Tabs.Content value="test-data"><TestDataPanel /></Tabs.Content>
	<Tabs.Content value="json"><JsonPanel /></Tabs.Content>
</Tabs.Root>
