---
title: Proof of consent
description: Keep a record of every choice, to show that a visitor consented.
---

The GDPR (art. 7) requires being able to show that a visitor consented. `onRecord` is called after every choice
with what proves it. zeste sends nothing by itself: sending and keeping the record is up to your site.

```ts
createZeste({
  services,
  policyVersion: '2026-10',
  onRecord: (record) => navigator.sendBeacon('/consent', JSON.stringify(record)),
});
```

```ts
// record
{
  id: '9f2c…',                       // random, kept in the consent cookie
  date: '2026-10-09T14:03:12.000Z',
  action: 'denyAll',
  choices: { gtag: false, youtube: false },
  policyVersion: '2026-10',
}
```

- `id` is random and kept in the consent cookie: it links the choices of one browser across changes, not a person.
- `action` says how the choice was made: `acceptAll`, `denyAll`, `set` (from the preferences), `grant` or `deny`
  (one service, from a placeholder), `category`.
- `choices` holds every service that needs consent, after the choice.
- `policyVersion` is the version of your policy the visitor answered. Changing it asks every visitor again.

Reading a stored choice back, on the next visit, is not a new choice and is not reported.

With the [script tag](../../start/script-tag/), put the same `onRecord` in `window.zesteConfig`.

## Keeping the records

Store them on your server with the date you received them. The record holds no personal data on its own; stored next to an IP
address or an account, it does. How long to keep them is a legal question for your site.
