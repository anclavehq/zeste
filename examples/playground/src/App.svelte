<!-- Demo: a small site using zeste, in the chosen lib and style. Services are simulated. -->
<script lang="ts">
	import { ConsentGate, createZeste, ZesteProvider, type ServiceDefinition } from '@zeste/svelte';
	import { memoryStorage } from '@zeste/core';
	import { messages } from '@zeste/services/i18n/fr';
	import * as bitsZeste from './skins/bits-zeste/index.ts';
	import * as bitsPelure from './skins/bits-pelure/index.ts';
	import * as arkZeste from './skins/ark-zeste/index.ts';
	import * as arkPelure from './skins/ark-pelure/index.ts';
	import * as shadcnZeste from './skins/shadcn-zeste/index.ts';
	import * as shadcnPelure from './skins/shadcn-pelure/index.ts';
	import { log, type PlaygroundConfig } from './protocol.ts';

	let { config }: { config: PlaygroundConfig } = $props();

	const skins = {
		'bits-zeste': bitsZeste,
		'bits-pelure': bitsPelure,
		'ark-zeste': arkZeste,
		'ark-pelure': arkPelure,
		'shadcn-zeste': shadcnZeste,
		'shadcn-pelure': shadcnPelure
	};
	// svelte-ignore state_referenced_locally
	const skin = skins[`${config.lib}-${config.style}`];

	/** Simulated service: instead of loading a third-party script, it writes to the log. */
	function simulated(key: string, name: string, category: string, needsConsent = true): ServiceDefinition {
		return {
			key,
			name,
			category,
			needsConsent,
			cookies: [],
			onGrant: () =>
				log('ok', needsConsent ? `${name} : script chargé` : `${name} : chargé d’office (exempté de consentement)`)
		};
	}

	const zeste = createZeste({
		services: [
			simulated('gtag', 'Google Analytics (GA4)', 'analytic'),
			simulated('matomocloud', 'Matomo Cloud', 'analytic'),
			simulated('youtube', 'YouTube', 'video'),
			simulated('plausible', 'Plausible', 'analytic', false)
		],
		storage: memoryStorage(),
		messages,
		guard: true
	});

	// Log of refusals (acceptances are logged by the services themselves)
	let previous: Record<string, string> = {};
	zeste.manager.subscribe((snapshot) => {
		for (const service of snapshot.services) {
			const was = previous[service.key];
			if (was && was !== service.status && service.status === 'denied') log('deny', `${service.name} : refusé`);
		}
		if (snapshot.needsReload && !previous.__reload) log('info', 'Un script déjà chargé a été refusé : rechargement proposé');
		previous = { ...snapshot.status, ...(snapshot.needsReload ? { __reload: '1' } : {}) };
	});
	log('info', 'Page chargée : aucun service tiers avant votre choix');
</script>

<ZesteProvider {zeste}>
	<div class="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
		<header class="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stone-200 px-5 py-3 dark:border-stone-800">
			<b class="font-semibold">Maison Exemple</b>
			<nav class="flex gap-4 text-sm text-stone-500 dark:text-stone-400" aria-label="Site de démo">
				<span>Carte</span><span>Réserver</span><span>Contact</span>
			</nav>
		</header>
		<main class="mx-auto grid max-w-2xl gap-3 px-5 pt-6 pb-48">
			<h1 class="text-2xl font-semibold tracking-tight">Cuisine de saison, au bord du port</h1>
			<p class="text-stone-600 dark:text-stone-400">Découvrez la maison en vidéo.</p>
			<ConsentGate service="youtube">
				<div
					class="grid aspect-video w-full max-w-xl place-items-center rounded-2xl bg-stone-900 text-stone-100"
					data-testid="video"
				>
					<div class="grid justify-items-center gap-2">
						<span class="grid size-14 place-items-center rounded-full bg-white/15 text-2xl">▶</span>
						<span class="text-sm">Vidéo YouTube (simulée)</span>
					</div>
				</div>
				{#snippet placeholder(props)}
					<skin.CookiePlaceholder {...props} />
				{/snippet}
			</ConsentGate>
		</main>
		<footer class="border-t border-stone-200 px-5 py-3 text-sm dark:border-stone-800">
			<button type="button" class="underline underline-offset-2" {@attach zeste.actions.openPreferences}>
				{zeste.messages.alertSmall}
			</button>
		</footer>
	</div>
	<skin.CookieBanner />
	<skin.CookiePreferences />
</ZesteProvider>
