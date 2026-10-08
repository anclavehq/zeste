<!-- Demo: picks the placeholder of the displayed style. In a real project, import yours directly. -->
<script lang="ts">
	import { page } from '$app/state';
	import type { ServiceState } from '@zeste/svelte';
	import { CookiePlaceholder as Zeste } from '#lib/components/zeste/index.ts';
	import { CookiePlaceholder as Pelure } from '#lib/components/zeste-pelure/index.ts';

	let props: { service: ServiceState; allow: () => void } = $props();
	const Component = $derived(page.data.style === 'pelure' ? Pelure : Zeste);
</script>

<Component {...props} />
