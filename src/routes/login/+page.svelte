<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { mode, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PageProps } from './$types.js';

	let { form }: PageProps = $props();

	let submitting = $state(false);
	let showPassword = $state(false);
	const isDark = $derived(mode.current === 'dark');
</script>

<svelte:head>
	<title>Cahayoyo Cockpit - Login</title>
</svelte:head>

<main class="relative grid min-h-svh place-items-center overflow-hidden bg-accent px-4 py-10">
	<div
		class="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/30 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-sky-300/50 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -bottom-28 left-1/4 size-96 rounded-full bg-indigo-300/40 blur-3xl"
	></div>

	<div
		class="relative w-full max-w-md space-y-6 rounded-2xl bg-card/90 p-6 text-card-foreground shadow-xl backdrop-blur-xl sm:p-8"
	>
		<button
			type="button"
			role="switch"
			aria-checked={isDark}
			aria-label="Toggle dark mode"
			onclick={toggleMode}
			class="absolute top-3 right-3 inline-flex h-6 w-11 items-center rounded-full border border-border bg-muted px-0.5 transition-colors before:absolute before:-inset-2.5 before:content-[''] motion-reduce:transition-none"
		>
			<span
				class="relative grid size-5 place-items-center rounded-full bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none {isDark
					? 'translate-x-5'
					: ''}"
			>
				<span
					class="absolute grid size-full place-items-center transition-[transform,opacity] duration-300 motion-reduce:transition-none {isDark
						? '-rotate-90 scale-0 opacity-0'
						: 'rotate-0 scale-100 opacity-100'}"
				>
					<Sun class="size-3 text-foreground" />
				</span>
				<span
					class="absolute grid size-full place-items-center transition-[transform,opacity] duration-300 motion-reduce:transition-none {isDark
						? 'rotate-0 scale-100 opacity-100'
						: 'rotate-90 scale-0 opacity-0'}"
				>
					<Moon class="size-3 text-foreground" />
				</span>
			</span>
		</button>

		<img
			src="/logo/cahayoyo-cockpit-logo-transparant.png"
			alt="Cahayoyo Cockpit"
			class="mx-auto h-36 w-auto sm:h-40 dark:hidden"
		/>
		<img
			src="/logo/cahayoyo-cockpit-logo-inverse.png"
			alt="Cahayoyo Cockpit"
			class="mx-auto hidden h-36 w-auto sm:h-40 dark:block"
		/>

		<div class="space-y-6">
			<div class="space-y-1">
				<h1 class="text-xl font-semibold">Sign in to your workspace</h1>
				<p class="text-sm text-muted-foreground">Enter your credentials to continue.</p>
			</div>

			{#if form?.error}
				<div
					class="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3"
					role="alert"
				>
					<CircleAlert class="size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{form.error}</p>
				</div>
			{/if}

			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="login-email">Email</Label>
					<Input
						id="login-email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
					/>
				</div>
				<div class="space-y-2">
					<Label for="login-password">Password</Label>
					<div class="relative">
						<Input
							id="login-password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							class="pr-9"
							required
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-0 h-8 w-9 rounded-l-none rounded-r-lg text-muted-foreground before:absolute before:-inset-1.5 before:content-['']"
						>
							{#if showPassword}
								<EyeOff class="size-4" />
							{:else}
								<Eye class="size-4" />
							{/if}
						</Button>
					</div>
				</div>
				<button
					type="submit"
					disabled={submitting}
					class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary via-blue-600 to-indigo-500 text-sm font-medium text-primary-foreground shadow-[0_4px_0_oklch(0.32_0.14_262)] transition-transform hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_oklch(0.32_0.14_262)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
				>
					{#if submitting}
						<LoaderCircle class="size-4 animate-spin" />
						<span class="sr-only">Signing in</span>
					{:else}
						Sign in
					{/if}
				</button>
			</form>
		</div>
	</div>
</main>
