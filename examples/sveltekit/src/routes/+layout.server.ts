import { parseConsentCookie } from '@zeste/svelte';
import type { LayoutServerLoad } from './$types';

// The choice is read on the server: the first render is already correct (no banner flash).
export const load: LayoutServerLoad = ({ cookies }) => ({
	consent: parseConsentCookie(cookies.get('tarteaucitron'))
});
