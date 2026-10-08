<script lang="ts">
	import { ConsentGate } from '@zeste/svelte';
	import { CookiePlaceholder } from '#lib/components/zeste/index.ts';
</script>

<h1 class="mb-6 font-serif text-4xl">Autre page</h1>

<ConsentGate service="youtube" embed={{ videoID: 'jNQXAC9IVRw' }} data-testid="video-other">
	{#snippet placeholder(props)}
		<CookiePlaceholder {...props} />
	{/snippet}
</ConsentGate>
