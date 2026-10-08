<script lang="ts">
	import '../app.css';
	import { createZeste, ZesteProvider } from '@zeste/svelte';
	import { googleConsentMode } from '@zeste/core';
	import { messages } from '@zeste/services/i18n/fr';
	import favicon from '#lib/assets/favicon.svg';
	import { services } from '#lib/consent.ts';
	import * as zesteStyle from '#lib/components/zeste/index.ts';
	import * as pelureStyle from '#lib/components/zeste-pelure/index.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// svelte-ignore state_referenced_locally
	const zeste = createZeste({
		services: services(),
		initial: data.consent,
		plugins: [googleConsentMode()],
		messages,
		// compliance guard: active in dev by default; forced here for the demo and the e2e tests.
		guard: true
	});

	// Demo: two generated styles (`zeste add` and `zeste add --style pelure`), pick either.
	const skin = $derived(data.style === 'pelure' ? pelureStyle : zesteStyle);
	const setDemo = (name: 'zeste-style' | 'zeste-theme', value: string) => {
		document.cookie = `${name}=${value}; path=/; samesite=lax`;
		location.reload();
	};
	const pill = (active: boolean) =>
		`rounded-full border px-3 py-1 ${active ? 'border-stone-900 font-semibold dark:border-stone-100' : 'border-stone-300 dark:border-stone-600'}`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ZesteProvider {zeste}>
	<header class="flex flex-wrap items-center gap-4 border-b border-stone-200 p-4 text-stone-900 dark:border-stone-800 dark:text-stone-100">
		<a href="/" class="underline-offset-2 hover:underline">Accueil</a>
		<a href="/other" class="underline-offset-2 hover:underline">Autre page</a>
		<div class="ml-auto flex items-center gap-2 text-sm" role="group" aria-label="Style de la démo">
			<span class="text-stone-600 dark:text-stone-400">Style :</span>
			{#each ['zeste', 'pelure'] as const as style (style)}
				<button type="button" class={pill(data.style === style)} aria-pressed={data.style === style} onclick={() => setDemo('zeste-style', style)}
					>{style}</button
				>
			{/each}
		</div>
		<div class="flex items-center gap-2 text-sm" role="group" aria-label="Thème de la démo">
			{#each [['light', 'clair'], ['dark', 'sombre']] as const as [theme, label] (theme)}
				<button type="button" class={pill(data.theme === theme)} aria-pressed={data.theme === theme} onclick={() => setDemo('zeste-theme', theme)}
					>{label}</button
				>
			{/each}
		</div>
	</header>
	<main class="mx-auto max-w-3xl p-4 text-stone-900 dark:text-stone-100">{@render children()}</main>
	<footer class="border-t border-stone-200 p-4 text-sm dark:border-stone-800 dark:text-stone-100">
		<!-- Permanent link to change one's choices (required by EU consent rules) -->
		<button type="button" class="underline underline-offset-2" {@attach zeste.actions.openPreferences}>
			{zeste.messages.alertSmall}
		</button>
	</footer>
	<skin.CookieBanner />
	<skin.CookiePreferences />
</ZesteProvider>
