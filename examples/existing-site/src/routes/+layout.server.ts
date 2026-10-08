import { parseConsentCookie } from '@zeste/svelte';
import type { LayoutServerLoad } from './$types';

// Same cookie as tarteaucitron: choices visitors already made are kept.
export const load: LayoutServerLoad = ({ cookies }) => ({
	consent: parseConsentCookie(cookies.get('tarteaucitron'))
});
