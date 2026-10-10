---
title: SvelteKit
description: Set up zeste in a SvelteKit app, with the choice read on the server.
---

## 1. Install and declare your services

```sh
npm install @zeste/svelte @zeste/core @zeste/services
npx zeste init
```

`zeste init` reads the project and writes `src/lib/consent.ts` with the services it finds (a tarteaucitron
configuration, Google Analytics or Matomo snippets, YouTube embeds…). You can also write it yourself:

```ts
// src/lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

Each service is a function from `@zeste/services`: its options are typed, and its code is only downloaded when the
visitor accepts it. The full list is in the [service catalog](../../reference/services/).

## 2. Read the choice on the server

```ts
// src/routes/+layout.server.ts
import { parseConsentCookie } from '@zeste/svelte';

export const load = ({ cookies }) => ({
  consent: parseConsentCookie(cookies.get('tarteaucitron')),
});
```

The first render is then already right: a visitor who has chosen never sees the banner flash.

## 3. Generate the interface

```sh
npx zeste add                 # detects Bits UI, Ark UI or shadcn-svelte
npx zeste add --style pelure  # the other style
```

This writes `CookieBanner`, `CookiePreferences` and `CookiePlaceholder` into `src/lib/components/zeste/`. See
[Your own UI](../../guides/ui/) to adapt them.

## 4. Wire it up

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { createZeste, ZesteProvider } from '@zeste/svelte';
  import { googleConsentMode } from '@zeste/core';
  import { messages } from '@zeste/services/i18n/en';
  import { CookieBanner, CookiePreferences } from '$lib/components/zeste';
  import { services } from '$lib/consent';

  let { data, children } = $props();
  // One instance per request: inside the component, never at module level.
  const zeste = createZeste({
    services: services(),
    initial: data.consent,
    plugins: [googleConsentMode()],
    messages,
  });
</script>

<ZesteProvider {zeste}>
  {@render children()}
  <CookieBanner />
  <CookiePreferences />
  <!-- A permanent link to change one's mind: required by EU consent rules -->
  <button {@attach zeste.actions.openPreferences}>Cookie settings</button>
</ZesteProvider>
```

In any child component, `getZeste()` returns the same object.

## Next

- Videos and maps: [Embedded content](../../guides/embeds/)
- Several languages: [Languages](../../guides/languages/)
- Everything `zeste` exposes: [API](../../reference/api/)
