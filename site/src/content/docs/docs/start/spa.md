---
title: Single-page apps
description: zeste in a client-only app (Vite) with Svelte, React or Vue, or with no framework at all.
---

Without a server, zeste reads the choice from the cookie in the browser, so you leave out `initial`. Everything else is the
same as in the [SvelteKit](../../start/sveltekit/), [Next.js](../../start/nextjs/) and [Nuxt](../../start/nuxt/)
guides, including `npx @zeste/cli add`.

```svelte
<!-- Svelte -->
<script lang="ts">
  import { createZeste, ZesteProvider } from '@zeste/svelte';
  import { googleConsentMode } from '@zeste/core';
  import { messages } from '@zeste/services/i18n/en';
  import { services } from './consent';

  const zeste = createZeste({ services: services(), plugins: [googleConsentMode()], messages });
</script>
```

```tsx
// React: createZeste in useState, as with Next.js, without `initial`
const [zeste] = useState(() => createZeste({ services: services(), plugins: [googleConsentMode()], messages }));
```

```ts
// Vue
const zeste = createZeste({ services: services(), plugins: [googleConsentMode()], messages });
```

## Without a framework, with a bundler

`@zeste/core` works on its own. You get a state to subscribe to and actions; the HTML is yours.

```ts
import { createConsent, googleConsentMode } from '@zeste/core';
import { gtag, youtube } from '@zeste/services';

const consent = createConsent({
  services: [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()],
  plugins: [googleConsentMode()],
});

document.querySelector('#accept').addEventListener('click', consent.grantAll);
document.querySelector('#deny').addEventListener('click', consent.denyAll);
consent.subscribe((state) => {
  document.querySelector('#banner').hidden = state.decided;
});
consent.start();
```

If you would rather not write the banner at all, use the [script tag](../../start/script-tag/) version.
