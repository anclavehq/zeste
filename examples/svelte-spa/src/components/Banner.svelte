<script lang="ts">
	import { ConsentBanner, getZeste } from '@zeste/svelte';
	import type { Messages } from '@zeste/services/i18n/types';

	const zeste = getZeste<Messages>();
	const t = zeste.messages;
</script>

{#if zeste.needsReload}
	<div class="reload" role="status">
		Vos choix seront entièrement appliqués après rechargement.
		<button type="button" onclick={() => location.reload()}>{t.reload}</button>
	</div>
{/if}

<!-- ConsentBanner is only rendered if the visitor has not chosen yet -->
<ConsentBanner class="zeste-banner" aria-label={t.icon} data-testid="banner">
	<p>{t.alertBigPrivacy}</p>
	<div class="actions">
		<!-- Same visual weight for refusing and accepting (EU consent guidance) -->
		<button type="button" {@attach zeste.actions.denyAll}>{t.denyAll}</button>
		<button type="button" {@attach zeste.actions.openPreferences}>{t.personalize}</button>
		<button type="button" {@attach zeste.actions.acceptAll}>{t.acceptAll}</button>
	</div>
</ConsentBanner>

<style>
	:global(.zeste-banner),
	.reload {
		position: fixed;
		inset: auto 1rem 1rem 1rem;
		padding: 1rem;
		background: #fafaf9;
		border: 1px solid #d6d3d1;
		border-radius: 0.75rem;
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.1);
	}
	.reload {
		inset: 1rem 1rem auto auto;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
