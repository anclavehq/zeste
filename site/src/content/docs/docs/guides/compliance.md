---
title: Compliance
description: The defaults zeste applies, Google Consent Mode, and the guard that checks your banner in development.
---

The EU consent rules come from the ePrivacy Directive (article 5(3)), the GDPR and the EDPB guidelines on cookie
banners. A few of their requirements can be checked by software. Nothing that needs consent may run before the
visitor consents. Refusing must be as easy as accepting. Visitors must be able to withdraw their consent at any
time. National authorities such as the French CNIL enforce these rules.

:::note
zeste applies strict defaults and checks what can be measured. Your banner texts, your privacy policy and the
purpose of each cookie still need a review, and zeste cannot do that for you.
:::

## Default settings

- zeste sends no request to a third party before consent. The tests check this at the browser's network level for
  every service in the catalog.
- Some tarteaucitron services have a cookieless mode that contacts the third party before consent, for example
  Matomo Cloud, GetQuanty and advanced Consent Mode. zeste turns these modes off. `allowPreConsentRequests: true`
  turns them all on, and a list of service keys turns on only those.
- The preferences show nothing pre-checked. A service the visitor did not choose is refused.
- When a visitor withdraws consent, zeste deletes the service's cookies and puts embeds back behind their
  placeholder. A script that already runs only stops when the page reloads. `zeste.needsReload` tells you when to
  offer a reload.
- Consent lasts 13 months (395 days). zeste then asks again. It also asks again when you change `policyVersion`.
- Some services do not need consent, for example a self-hosted Matomo configured for it. They have
  `needsConsent: false`, load right away and appear in `zeste.exempt`.

## Google Consent Mode v2

```ts
import { googleConsentMode } from '@zeste/core';

createZeste({ services, plugins: [googleConsentMode()] });
```

The plugin sets every Google consent signal to `denied` when the page loads. After each choice, it updates the
signals from the Google services the visitor accepted (Google Analytics, Ads and Tag Manager). The script tag
version turns the plugin on by default.

## The compliance guard

In development, zeste checks how the banner actually renders, whatever your design system, and warns in the
console when:

- the banner has no "Deny all" button at its first level, or the button is invisible;
- "Deny all" is clearly smaller than "Accept all", or has less contrast (zeste reads any CSS color, including the
  `oklch` colors of Tailwind v4);
- nothing lets the visitor reopen the preferences after choosing.

```
[zeste/consent] "Deny all" is much smaller than "Accept all" (area 24%, text 9px vs 14px). Both choices must be equally prominent.
```

The guard runs in development and stays off in production. `guard: true` turns it on everywhere.

The guard finds the buttons through zeste's actions: `{@attach zeste.actions.denyAll}` in Svelte,
`{...zeste.actions.denyAll}` in React and `v-bind="zeste.actions.denyAll"` in Vue. It cannot check a button that
uses a plain click handler.
