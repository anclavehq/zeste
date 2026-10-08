<!-- Design system modal window (Ark UI). -->
<script lang="ts">
	import { Dialog, Portal } from '@ark-ui/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(), title, description, children, footer }: Props = $props();
</script>

<Dialog.Root bind:open lazyMount unmountOnExit>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-emerald-950/50" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
			<Dialog.Content class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-amber-50 p-8 text-emerald-950 shadow-2xl">
				<Dialog.Title class="pr-8 font-serif text-2xl">{title}</Dialog.Title>
				{#if description}
					<Dialog.Description class="mt-2 text-emerald-900/80">{description}</Dialog.Description>
				{/if}
				<div class="mt-6">{@render children()}</div>
				{#if footer}
					<div class="mt-8 flex flex-wrap justify-end gap-3">{@render footer()}</div>
				{/if}
				<Dialog.CloseTrigger class="absolute top-5 right-5 rounded-full p-1 text-emerald-900 hover:bg-emerald-100" aria-label="Fermer">
					<span aria-hidden="true">✕</span>
				</Dialog.CloseTrigger>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog.Root>
