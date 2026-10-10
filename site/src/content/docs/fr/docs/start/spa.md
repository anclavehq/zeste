---
title: Applications monopage
description: zeste dans une app sans serveur (Vite) avec Svelte, React ou Vue, ou sans framework du tout.
---

Sans serveur, zeste lit le choix dans le cookie, dans le navigateur, donc vous n'indiquez pas `initial`. Tout le reste est
identique aux guides [SvelteKit](../sveltekit/), [Next.js](../nextjs/) et [Nuxt](../nuxt/), `npx @zeste/cli add` compris.

```svelte
<!-- Svelte -->
<script lang="ts">
  import { createZeste, ZesteProvider } from '@zeste/svelte';
  import { googleConsentMode } from '@zeste/core';
  import { messages } from '@zeste/services/i18n/fr';
  import { services } from './consent';

  const zeste = createZeste({ services: services(), plugins: [googleConsentMode()], messages });
</script>
```

```tsx
// React : createZeste dans useState, comme avec Next.js, sans `initial`
const [zeste] = useState(() => createZeste({ services: services(), plugins: [googleConsentMode()], messages }));
```

```ts
// Vue
const zeste = createZeste({ services: services(), plugins: [googleConsentMode()], messages });
```

## Sans framework, avec un bundler

`@zeste/core` fonctionne seul. Vous recevez un état auquel vous abonner et des actions ; le HTML est à vous.

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

Si vous préférez ne pas écrire la bannière du tout, prenez la version [balise script](../script-tag/).
