<script lang="ts">
	import { ConsentGate } from '@zeste/svelte';
	import CookiePlaceholder from '#lib/components/Placeholder.svelte';

	let showSecond = $state(false);
</script>

<h1 class="mb-4 text-2xl font-semibold">zeste + Tailwind</h1>

<ConsentGate service="youtube" embed={{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }} data-testid="video-1">
	{#snippet placeholder(props)}
		<CookiePlaceholder {...props} />
	{/snippet}
</ConsentGate>

<p class="my-4">
	<button type="button" class="underline underline-offset-2" onclick={() => (showSecond = !showSecond)}>
		Afficher une 2ᵉ vidéo
	</button>
</p>

{#if showSecond}
	<ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-2">
		{#snippet placeholder(props)}
			<CookiePlaceholder {...props} />
		{/snippet}
	</ConsentGate>
{/if}
