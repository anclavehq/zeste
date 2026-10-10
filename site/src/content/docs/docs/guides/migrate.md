---
title: Migrate from tarteaucitron
description: Move a site from tarteaucitron.js to zeste and keep the choices visitors already made.
---

zeste reads and writes the same cookie as tarteaucitron, with the same name and format. Visitors keep their
choices and do not see the banner again.

## Site without a framework

Replace tarteaucitron's `<script>` tag with zeste's [script tag](../../start/script-tag/), in the same place in
`<head>`. zeste reads your existing configuration, so `tarteaucitron.init({…})`, `tarteaucitron.user.*` and
`tarteaucitron.job` can stay unchanged. Links to `#tarteaucitron` and the `youtube_player` markup keep working.

## App with Svelte, React or Vue

1. Remove tarteaucitron and declare the same services. `npx zeste init` reads your tarteaucitron configuration
   and writes it for zeste. It picks up the services, the `tarteaucitron.user.*` options, the cookie name and
   domain, and Consent Mode. Its report lists what to remove and what to fill in, with the file and line of each
   item.
2. Run `npx zeste add` to generate the banner and the preferences.
3. Replace the generated buttons, dialog and switches with your design system's components. See
   [Your own UI](../ui/).
4. Put embedded videos and maps behind `<ConsentGate>`. The old `.youtube_player` markup keeps working, and
   `<ConsentGate>` adds a placeholder that the server renders in your site's style. See
   [Embedded content](../embeds/).

:::caution
A button component must pass its props down to its HTML element. If it does not, zeste's actions are not attached
and clicking the button does nothing. TypeScript does not catch this mistake. The
[compliance guard](../compliance/) reports it in the console.
:::

## What changes for the site

- The page no longer loads tarteaucitron's script and stylesheet.
- tarteaucitron's cookieless modes, which contact a third party before consent (Matomo Cloud, GetQuanty,
  advanced Consent Mode), are off by default. If your site relies on one of them, turn it on with
  `allowPreConsentRequests`.
- If you used a custom cookie name (`cookieName`) or domain (`cookieDomain`), zeste needs them too. `zeste init`
  copies them from your configuration.
