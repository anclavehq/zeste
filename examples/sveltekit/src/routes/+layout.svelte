<script lang="ts">
	import { createZeste, ZesteProvider } from '@zeste/svelte';
	import { googleConsentMode } from '@zeste/core';
	import { messages } from '@zeste/services/i18n/fr';
	import favicon from '#lib/assets/favicon.svg';
	import { services } from '#lib/consent.ts';
	import Banner from '#lib/components/Banner.svelte';
	import Preferences from '#lib/components/Preferences.svelte';
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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ZesteProvider {zeste}>
	<nav>
		<a href="/">Accueil</a>
		<a href="/other">Autre page</a>
		<button type="button" {@attach zeste.actions.openPreferences}>{zeste.messages.alertSmall}</button>
	</nav>
	<main>{@render children()}</main>
	<Banner />
	<Preferences />
</ZesteProvider>

<style>
	:global(body) {
		font-family: system-ui, sans-serif;
		margin: 0;
		color: #1c1917;
	}
	nav {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e7e5e4;
	}
	main {
		padding: 1rem;
		max-width: 48rem;
	}
</style>
