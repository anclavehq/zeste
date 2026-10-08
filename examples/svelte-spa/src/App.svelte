<script lang="ts">
	import { ConsentGate, createZeste, ZesteProvider } from '@zeste/svelte';
	import { googleConsentMode } from '@zeste/core';
	import { messages } from '@zeste/services/i18n/fr';
	import { services } from './consent.ts';
	import Banner from './components/Banner.svelte';
	import Preferences from './components/Preferences.svelte';

	// No server: the choice is read from the cookie in the browser.
	const zeste = createZeste({
		services: services(),
		plugins: [googleConsentMode()],
		messages,
		// compliance guard: active in dev by default; forced here for the demo and the e2e tests.
		guard: true
	});

	let showSecond = $state(false);
</script>

<ZesteProvider {zeste}>
	<nav>
		<button type="button" {@attach zeste.actions.openPreferences}>{zeste.messages.alertSmall}</button>
	</nav>
	<main>
		<h1>zeste + Svelte</h1>

		<ConsentGate service="youtube" embed={{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }} data-testid="video-1">
			{#snippet placeholder({ service, allow })}
				<div class="placeholder" data-testid="video-1-placeholder">
					<p>Cette vidéo est hébergée par {service.name}.</p>
					<button type="button" onclick={allow}>Voir la vidéo</button>
				</div>
			{/snippet}
		</ConsentGate>

		<p>
			<button type="button" onclick={() => (showSecond = !showSecond)}>Afficher une 2ᵉ vidéo</button>
		</p>

		{#if showSecond}
			<ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-2" />
		{/if}
	</main>
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
	.placeholder {
		display: grid;
		place-items: center;
		width: 560px;
		max-width: 100%;
		aspect-ratio: 16 / 9;
		background: #f5f5f4;
		border-radius: 0.5rem;
	}
</style>
