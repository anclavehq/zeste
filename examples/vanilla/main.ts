import { createConsent, googleConsentMode } from '@zeste/core';
import { gtag, matomocloud, youtube } from '@zeste/services';

// Synchronous: service info is available right away (including on the server).
// Each service's code is only downloaded when it needs to run.
const consent = createConsent({
  services: [
    gtag({ gtagUa: 'G-XXXXXXX' }),
    youtube(),
    matomocloud({ matomoId: 1, matomoHost: 'https://example.matomo.cloud/' }),
  ],
  plugins: [googleConsentMode()],
});

const banner = document.querySelector<HTMLElement>('#banner')!;
document.querySelector('#accept')!.addEventListener('click', consent.grantAll);
document.querySelector('#deny')!.addEventListener('click', consent.denyAll);

consent.subscribe((state) => {
  banner.hidden = state.decided;
  document.querySelector('#state')!.textContent = JSON.stringify(state.status, null, 2);
});

consent.start();
