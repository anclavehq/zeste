<script lang="ts">
	import { ConsentGate } from '@zeste/svelte';
	import { CookiePlaceholder } from '#lib/components/zeste/index.ts';
	import Button from '#lib/ui/Button.svelte';
	import Modal from '#lib/ui/Modal.svelte';
	import Toggle from '#lib/ui/Toggle.svelte';

	let newsletterOpen = $state(false);
	let weekly = $state(true);
	let showSecond = $state(false);
</script>

<h1 class="mb-2 font-serif text-4xl">Bienvenue à la Maison Exemple</h1>
<p class="mb-8 text-emerald-900/80">Un site fait il y a longtemps, avec son propre design system sur Ark UI.</p>

<ConsentGate service="youtube" embed={{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }} data-testid="video-1">
	{#snippet placeholder(props)}
		<CookiePlaceholder {...props} />
	{/snippet}
</ConsentGate>

<p class="my-6 flex gap-3">
	<Button variant="secondary" onclick={() => (showSecond = !showSecond)}>Afficher une 2ᵉ vidéo</Button>
	<Button onclick={() => (newsletterOpen = true)}>Newsletter</Button>
</p>

{#if showSecond}
	<ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-2">
		{#snippet placeholder(props)}
			<CookiePlaceholder {...props} />
		{/snippet}
	</ConsentGate>
{/if}

<Modal bind:open={newsletterOpen} title="Newsletter" description="Choisissez vos envois.">
	<Toggle bind:checked={weekly} label="Lettre hebdomadaire" hint="Le vendredi matin" />
	{#snippet footer()}
		<Button onclick={() => (newsletterOpen = false)}>Enregistrer</Button>
	{/snippet}
</Modal>
