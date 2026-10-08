import { createConsent, googleConsentMode } from '@zeste/core';
import { gtag, matomocloud, youtube } from '@zeste/services';

const params = new URLSearchParams(location.search);
const consent = createConsent({
  services: [
    gtag({ gtagUa: params.get('ga') ?? 'G-TEST000000' }),
    youtube(),
    matomocloud({ matomoId: 1, matomoHost: 'https://zeste-e2e.invalid/' }),
  ],
  plugins: [googleConsentMode()],
});

const banner = document.querySelector<HTMLElement>('#banner')!;
document.querySelector('#accept')!.addEventListener('click', consent.grantAll);
document.querySelector('#deny')!.addEventListener('click', consent.denyAll);
consent.subscribe((state) => {
  banner.hidden = state.decided;
});
consent.start();
window.__zeste = { consent };
