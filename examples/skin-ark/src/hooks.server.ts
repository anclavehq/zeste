import type { Handle } from '@sveltejs/kit/hooks';

// Demo: dark theme chosen by cookie, applied from the server render (`dark` class on <html>).
export const handle: Handle = ({ event, resolve }) => {
	const dark = event.cookies.get('zeste-theme') === 'dark';
	return resolve(event, {
		transformPageChunk: ({ html }) => (dark ? html.replace('<html lang="fr">', '<html lang="fr" class="dark">') : html)
	});
};
