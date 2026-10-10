---
title: Proof of consent
description: Keep a record of each choice to show that a visitor consented.
---

Article 7 of the GDPR requires you to be able to show that a visitor consented. zeste calls `onRecord` after each
choice with a record of it. zeste does not send the record anywhere. Your site sends it to your server and keeps
it.

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
  id: '9f2c…',                       // random, stored in the consent cookie
  date: '2026-10-09T14:03:12.000Z',
  action: 'denyAll',
  choices: { gtag: false, youtube: false },
  policyVersion: '2026-10',
}
```

The record has these fields:

- `id` is random and stored in the consent cookie. It links the successive choices made in one browser. It does
  not identify a person.
- `action` says how the visitor chose. It is `acceptAll`, `denyAll`, `set` (from the preferences), `grant` or
  `deny` (one service, from a placeholder), or `category`.
- `choices` lists every service that needs consent, with its state after the choice.
- `policyVersion` is the version of your policy that the visitor answered. When you change it, zeste asks every
  visitor again.

On a later visit, zeste reads the stored choice from the cookie. That is not a new choice, and `onRecord` is not
called.

With the [script tag](../../start/script-tag/), put the same `onRecord` function in `window.zesteConfig`.

## Keeping the records

Store each record on your server with the date you received it. A record contains no personal data on its own.
It becomes personal data if you store it with an IP address or an account. How long to keep the records is a
legal question for your site.
