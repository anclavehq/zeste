<!-- Button from the Maison Exemple design system. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'type' | 'children'> {
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		onclick?: HTMLButtonAttributes['onclick'];
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', type = 'button', onclick, children, ...rest }: Props = $props();

	const variants = {
		primary: 'bg-emerald-800 text-white hover:bg-emerald-900',
		secondary: 'border border-emerald-800 bg-white text-emerald-900 hover:bg-emerald-50',
		ghost: 'text-emerald-900 hover:bg-emerald-50'
	};
	const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-5 py-2.5 text-base' };
</script>

<button
	{...rest}
	{type}
	{onclick}
	class="inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 {variants[
		variant
	]} {sizes[size]}"
>
	{@render children()}
</button>
