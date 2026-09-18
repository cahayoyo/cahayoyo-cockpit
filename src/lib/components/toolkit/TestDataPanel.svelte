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
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import {
		TEST_DATA_FIELDS,
		generateRecord,
		generateTestData,
		type TestDataField
	} from '$lib/toolkit/test-data.js';

	const FIELD_LABELS: Record<TestDataField, string> = {
		name: 'Full name',
		email: 'Email',
		phone: 'Phone (+62)',
		nik: 'NIK',
		address: 'Address'
	};

	let count = $state(3);
	let outputs = $state<Record<TestDataField, string>>({
		name: '',
		email: '',
		phone: '',
		nik: '',
		address: ''
	});

	function generateField(field: TestDataField): void {
		outputs = { ...outputs, [field]: generateTestData(field, count).join('\n') };
	}

	function generateAll(): void {
		outputs = { ...generateRecord() };
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Test-data generator</CardTitle>
		<CardDescription>Indonesian fixtures from static name lists.</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="space-y-2">
				<Label for="test-data-count">Count (1–10)</Label>
				<Input
					id="test-data-count"
					type="number"
					min="1"
					max="10"
					bind:value={count}
					class="w-28"
				/>
			</div>
			<Button onclick={generateAll}>Generate all</Button>
		</div>

		<div class="space-y-4">
			{#each TEST_DATA_FIELDS as field (field)}
				<div class="space-y-1.5">
					<div class="flex items-center justify-between gap-2">
						<Label for={`test-data-${field}`}>{FIELD_LABELS[field]}</Label>
						<Button variant="ghost" size="sm" onclick={() => generateField(field)}>Generate</Button>
					</div>
					<div class="flex items-start gap-2">
						<Textarea
							id={`test-data-${field}`}
							readonly
							value={outputs[field]}
							class="min-h-16 font-mono text-xs"
							aria-label={`${FIELD_LABELS[field]} output`}
						/>
						<CopyButton value={outputs[field]} label={`${FIELD_LABELS[field]} copied`} />
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
