<!-- Design system switch (Ark UI). -->
<script lang="ts">
	import { Switch } from '@ark-ui/svelte';

	interface Props {
		checked: boolean;
		label: string;
		hint?: string;
	}

	let { checked = $bindable(), label, hint }: Props = $props();
</script>

<Switch.Root bind:checked class="flex w-full items-center justify-between gap-4">
	<span>
		<Switch.Label class="font-medium">{label}</Switch.Label>
		{#if hint}<span class="block text-sm text-emerald-900/70">{hint}</span>{/if}
	</span>
	<Switch.Control class="inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-emerald-900/20 p-0.5 transition data-[state=checked]:bg-emerald-800 data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-emerald-800">
		<Switch.Thumb class="block size-6 rounded-full bg-white shadow transition data-[state=checked]:translate-x-5" />
	</Switch.Control>
	<Switch.HiddenInput role="switch" />
</Switch.Root>
