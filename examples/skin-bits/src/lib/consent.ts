import { gtag, matomocloud, youtube } from '@zeste/services';

/** The site's services. A function: the list is recreated for every request on the server. */
export const services = () => [
	gtag({ gtagUa: 'G-TEST000000' }),
	youtube(),
	matomocloud({ matomoId: 1, matomoHost: 'https://zeste-e2e.invalid/' })
];
