---
title: Migrate from tarteaucitron
description: Move a site from tarteaucitron.js to zeste without losing visitors' choices.
---

zeste reads and writes the same cookie as tarteaucitron (same name, same format): **visitors keep their choices**
and do not see the banner again.

## Site without a framework

Replace tarteaucitron's `<script>` tag with zeste's [script tag](../../start/script-tag/), at the same place in
`<head>`. Keep your configuration as it is: `tarteaucitron.init({…})`, `tarteaucitron.user.*` and
`tarteaucitron.job` are read by zeste. `#tarteaucitron` links and the `youtube_player` markup keep working.

## App with Svelte, React or Vue

1. **Remove tarteaucitron and declare the same services.** `npx zeste init` reads your tarteaucitron configuration
   (services, `tarteaucitron.user.*` options, cookie name and domain, Consent Mode) and writes it for zeste. Its
   report lists, file and line, what to remove and what is left to fill in.
2. **Generate the interface:** `npx zeste add`.
3. **Swap in your design system.** Replace the generated buttons, dialog and switches with yours. See
   [Your own UI](../ui/).
4. **Put embeds behind `<ConsentGate>`.** The old `.youtube_player` markup keeps working, but `<ConsentGate>` gives
   you a placeholder rendered on the server in your site's style. See [Embedded content](../embeds/).

:::caution
A button component that does not forward its props to its HTML element leaves zeste's actions unwired: the click
does nothing. TypeScript does not see it; the [compliance guard](../compliance/) does.
:::

## What changes for the site

- tarteaucitron's script and CSS are no longer loaded.
- tarteaucitron's "cookieless" modes that contact a third party before consent (Matomo Cloud, GetQuanty, advanced
  Consent Mode…) are off by default. Turn them on explicitly with `allowPreConsentRequests` if you rely on them.
- A custom cookie name (`cookieName`) or domain (`cookieDomain`) must be passed to zeste as well; `zeste init`
  picks them up.
