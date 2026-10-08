<!--
  Placeholder for blocked content (video, map…) — pass it to <ConsentGate>:
  {#snippet placeholder(props)}<CookiePlaceholder {...props} />{/snippet}
-->
<script lang="ts">
	import { getZeste, type ServiceState } from '@zeste/svelte';
	import type { Messages } from '@zeste/services/i18n/types';
	import Button from '#lib/ui/Button.svelte';

	interface Props {
		service: ServiceState;
		allow: () => void;
	}

	let { service, allow }: Props = $props();
	const t = getZeste<Messages>().messages;
</script>

<div
	class="flex aspect-video w-full max-w-xl flex-col items-center justify-center gap-4 rounded-2xl bg-emerald-950 p-6 text-center text-amber-50"
>
	<p class="font-serif text-lg">{service.name} {t.fallback}</p>
	<Button variant="secondary" onclick={allow}>{t.allow} {service.name}</Button>
</div>
