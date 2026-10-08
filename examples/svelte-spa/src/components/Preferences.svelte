<script lang="ts">
	import { getZeste } from '@zeste/svelte';
	import type { Messages } from '@zeste/services/i18n/types';

	const zeste = getZeste<Messages>();
	const t = zeste.messages;
	let dialog = $state<HTMLDialogElement>();

	// The native <dialog> follows `zeste.preferencesOpen` (including Escape / closing).
	$effect(() => {
		if (zeste.preferencesOpen && !dialog?.open) dialog?.showModal();
		if (!zeste.preferencesOpen && dialog?.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={zeste.closePreferences} aria-labelledby="zeste-prefs-title">
	<h2 id="zeste-prefs-title">{t.title}</h2>
	<p class="details">{t.disclaimer}</p>

	{#each zeste.categories as category (category.key)}
		<fieldset>
			<legend>{t.categories[category.key]?.title ?? category.key}</legend>
			<p class="details">{t.categories[category.key]?.details}</p>
			{#each category.services as service (service.key)}
				<label>
					<input type="checkbox" bind:checked={zeste.draft[service.key]} name={service.key} />
					{service.name}
					{#if service.privacyUrl}
						<a href={service.privacyUrl} target="_blank" rel="noreferrer">{t.privacyUrl} {t.newWindow}</a>
					{/if}
				</label>
			{/each}
		</fieldset>
	{/each}

	{#if zeste.exempt.length}
		<p class="details">
			{t.mandatoryTitle} : {zeste.exempt.map((s) => s.name).join(', ')}
		</p>
	{/if}

	<div class="actions">
		<button type="button" {@attach zeste.actions.denyAll}>{t.denyAll}</button>
		<button type="button" {@attach zeste.actions.acceptAll}>{t.acceptAll}</button>
		<button type="button" {@attach zeste.actions.savePreferences}>{t.save}</button>
	</div>
</dialog>

<style>
	dialog {
		border: 1px solid #d6d3d1;
		border-radius: 0.75rem;
		max-width: 32rem;
	}
	fieldset {
		border: 1px solid #e7e5e4;
		border-radius: 0.5rem;
		margin-bottom: 0.75rem;
	}
	label {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.details {
		font-size: 0.875rem;
		color: #57534e;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
