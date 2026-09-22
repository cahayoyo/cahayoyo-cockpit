<script lang="ts">
	// Password generator popover (grill decision 8): length (default 20) and an
	// exclude-ambiguous toggle, reusing the toolkit charset logic. Generate
	// applies the value straight to the editor field so the dialog stays a
	// single form.
	import WandSparkles from '@lucide/svelte/icons/wand-sparkles';
	import { Popover } from 'bits-ui';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { generatePassword } from '$lib/vault/password.js';

	let { onapply }: { onapply: (secret: string) => void } = $props();

	let open = $state(false);
	let length = $state(20);
	let excludeAmbiguous = $state(false);
	let output = $state('');

	function generate(): void {
		output = generatePassword(length, excludeAmbiguous);
		onapply(output);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" size="sm" {...props} aria-label="Generate password">
				<WandSparkles class="size-4" />
				Generate
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content
			align="end"
			sideOffset={4}
			class="z-50 w-72 rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none"
		>
			<div class="space-y-3">
				<div class="space-y-1">
					<Label for="vault-generator-length">Length</Label>
					<Input
						id="vault-generator-length"
						type="number"
						min="1"
						max="256"
						bind:value={length}
						class="w-24"
					/>
				</div>

				<label class="flex items-center gap-2 text-sm">
					<input type="checkbox" class="size-4 accent-primary" bind:checked={excludeAmbiguous} />
					Exclude ambiguous (I, l, 1, O, 0)
				</label>

				<Button variant="secondary" onclick={generate}>Generate</Button>

				{#if output}
					<div class="flex items-center gap-1">
						<span class="min-w-0 flex-1 truncate font-mono text-xs">{output}</span>
						<CopyButton value={output} label="Password copied" class="size-6" />
					</div>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
