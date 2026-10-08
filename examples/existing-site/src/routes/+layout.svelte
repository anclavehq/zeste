<script lang="ts">
	import '../app.css';
	import { createZeste, ZesteProvider } from '@zeste/svelte';
	import { googleConsentMode } from '@zeste/core';
	import { messages } from '@zeste/services/i18n/fr';
	import favicon from '#lib/assets/favicon.svg';
	import { services } from '#lib/consent.ts';
	import { CookieBanner, CookiePreferences } from '#lib/components/zeste/index.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// svelte-ignore state_referenced_locally
	const zeste = createZeste({
		services: services(),
		initial: data.consent,
		plugins: [googleConsentMode()],
		messages,
		guard: true // demo: compliance guard in production too
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Maison Exemple</title>
</svelte:head>

<ZesteProvider {zeste}>
	<div class="min-h-screen bg-amber-50 text-emerald-950">
		<header class="flex items-center gap-6 border-b border-emerald-900/10 px-6 py-4">
			<a href="/" class="font-serif text-xl">Maison Exemple</a>
			<nav class="flex gap-4 text-sm">
				<a href="/" class="hover:underline">Accueil</a>
				<a href="/other" class="hover:underline">Autre page</a>
			</nav>
		</header>
		<main class="mx-auto max-w-3xl px-6 py-10">{@render children()}</main>
		<footer class="border-t border-emerald-900/10 px-6 py-4 text-sm">
			<button type="button" class="underline underline-offset-2" {@attach zeste.actions.openPreferences}>
				{zeste.messages.alertSmall}
			</button>
		</footer>
	</div>
	<CookieBanner />
	<CookiePreferences />
</ZesteProvider>
