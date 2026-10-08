<!--
  Placeholder for blocked content (video, map…), "pelure" style — pass it to <ConsentGate>:
  {#snippet placeholder(props)}<CookiePlaceholder {...props} />{/snippet}
-->
<script lang="ts">
	import { getZeste, type ServiceState } from '@zeste/svelte';
	import type { Messages } from '@zeste/services/i18n/types';
	import './theme.css';

	interface Props {
		service: ServiceState;
		allow: () => void;
	}

	let { service, allow }: Props = $props();
	const t = getZeste<Messages>().messages;
</script>

<div data-zeste-skin="pelure" class="grid aspect-video w-full max-w-xl place-items-center rounded-[14px] bg-(--zeste-ink) p-6">
	<div
		class="grid justify-items-center gap-3 rounded-[10px] border-[2.5px] border-(--zeste-ink) bg-(--zeste-paper) px-5 py-4 text-center text-(--zeste-ink) shadow-[5px_5px_0_var(--zeste-card)]"
	>
		<p class="text-sm font-semibold">{service.name} {t.fallback}</p>
		<button
			type="button"
			onclick={allow}
			class="inline-flex items-center justify-center rounded-[10px] border-[2.5px] border-(--zeste-ink) bg-(--zeste-card) px-[18px] py-2.5 text-sm font-bold text-(--zeste-ink) shadow-[4px_4px_0_var(--zeste-ink)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--zeste-ink)] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-(--zeste-card)"
		>
			{t.allow} {service.name}
		</button>
	</div>
</div>
