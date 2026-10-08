<script lang="ts">
	import { ConsentGate } from '@zeste/svelte';

	let showSecond = $state(false);
</script>

<h1>zeste + SvelteKit</h1>

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

<style>
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
