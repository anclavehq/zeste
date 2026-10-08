<script lang="ts">
	import { ConsentGate } from '@zeste/svelte';
	import CookiePlaceholder from '#lib/components/Placeholder.svelte';
</script>

<h1 class="mb-4 text-2xl font-semibold">Autre page</h1>

<ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-other">
	{#snippet placeholder(props)}
		<CookiePlaceholder {...props} />
	{/snippet}
</ConsentGate>
