---
title: Compliance
description: What zeste enforces by default, and the guard that checks your banner while you develop.
---

Consent rules across the EU (ePrivacy Directive art. 5(3), GDPR, and the EDPB guidance on cookie banners) boil down
to a few checkable points: nothing non-essential runs before consent, refusing must be as easy as accepting, and
withdrawing consent must stay possible at any time. Regulators such as the French CNIL enforce them actively.

:::note
zeste applies strict defaults and checks what can be measured. It does not make a site compliant on its own: your
texts, your privacy policy and what each cookie is really for still need a review.
:::

## Strict by default

- **No request to a third party before consent**, checked at the browser's network level for every service of the
  catalog.
- tarteaucitron's **"cookieless" modes** that contact a third party before consent (Matomo Cloud, GetQuanty,
  advanced Consent Mode…) are off. `allowPreConsentRequests: true` turns them all on, a list of keys only those.
- **Nothing pre-checked** in the preferences; a service the visitor did not choose is refused.
- **Withdrawal** deletes the service's cookies and puts embeds back behind their placeholder. A script already
  running can only be stopped by a reload: `zeste.needsReload` tells you when to offer one.
- **Consent lasts 13 months** (395 days), then is asked again. It is asked again too when `policyVersion` changes.
- **Exempt services** (`needsConsent: false`, for example self-hosted Matomo configured for it) load right away
  and are listed in `zeste.exempt`.

## Google Consent Mode v2

```ts
import { googleConsentMode } from '@zeste/core';

createZeste({ services, plugins: [googleConsentMode()] });
```

The plugin sets every Google signal to `denied` by default, then updates them on every choice, from the services
the visitor accepted (Google Analytics, Ads, Tag Manager). It is on by default in the script tag version.

## The guard

In development, zeste watches how the banner actually renders, whatever the design system, and warns in the
console if:

- the banner has no "Deny all" button at the first level, or it is invisible;
- "Deny all" is clearly smaller or less contrasted than "Accept all" (any CSS color, Tailwind v4's `oklch`
  included);
- nothing lets the visitor reopen the preferences once the choice is made.

```
[zeste/consent] "Deny all" is much smaller than "Accept all" (area 24%, text 9px vs 14px). Both choices must be equally prominent.
```

It is on in development and off in production; `guard: true` forces it. It finds the buttons through zeste's
actions (`{@attach zeste.actions.denyAll}`, `{...zeste.actions.denyAll}`, `v-bind="zeste.actions.denyAll"`): a
button wired with a plain click handler is not checked.
