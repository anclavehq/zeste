import { parseConsentCookie } from '@zeste/svelte';
import type { LayoutServerLoad } from './$types';

// The choice is read on the server: the first render is already correct (no banner flash).
// `zeste-style` and `zeste-theme` are only for the demo, to compare styles and themes.
export const load: LayoutServerLoad = ({ cookies }) => ({
	consent: parseConsentCookie(cookies.get('tarteaucitron')),
	style: cookies.get('zeste-style') === 'pelure' ? ('pelure' as const) : ('zeste' as const),
	theme: cookies.get('zeste-theme') === 'dark' ? ('dark' as const) : ('light' as const)
});
