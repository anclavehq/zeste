---
title: Next.js
description: Installer zeste dans une app Next.js (App Router), avec le choix lu côté serveur.
---

## 1. Installer et déclarer ses services

```sh
npm install @zeste/react @zeste/core @zeste/services
npx @zeste/cli init
```

`zeste init` écrit `lib/consent.ts` (dans `src/` si le projet en a un) avec les services qu'il trouve. Vous pouvez
aussi l'écrire vous-même :

```ts
// lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

## 2. Lire le choix côté serveur

```tsx
// app/layout.tsx (composant serveur)
import { cookies } from 'next/headers';
import { parseConsentCookie } from '@zeste/react';
import { Consent } from './Consent';

export default async function RootLayout({ children }) {
  const consent = parseConsentCookie((await cookies()).get('tarteaucitron')?.value);
  return (
    <html lang="fr">
      <body>
        <Consent initial={consent}>{children}</Consent>
      </body>
    </html>
  );
}
```

## 3. Générer l'interface

```sh
npx @zeste/cli add                 # détecte Radix, Ark UI ou shadcn/ui
npx @zeste/cli add --style pelure
```

`CookieBanner`, `CookiePreferences` et `CookiePlaceholder` sont écrits dans `components/zeste/`.

## 4. Ajouter zeste au layout

```tsx
// app/Consent.tsx
'use client';
import { useState } from 'react';
import { createZeste, ZesteProvider } from '@zeste/react';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { CookieBanner, CookiePreferences } from '@/components/zeste';
import { services } from '@/lib/consent';

export function Consent({ initial, children }) {
  // Une instance par requête côté serveur, une par page dans le navigateur : jamais au niveau du module.
  const [zeste] = useState(() =>
    createZeste({ services: services(), initial, plugins: [googleConsentMode()], messages }),
  );
  return (
    <ZesteProvider zeste={zeste}>
      {children}
      <CookieBanner />
      <CookiePreferences />
      {/* Un lien permanent pour changer d'avis : exigé par les règles européennes */}
      <button {...zeste.actions.openPreferences}>Gestion des cookies</button>
    </ZesteProvider>
  );
}
```

Dans un composant enfant, `useZeste()` renvoie le même objet et refait le rendu à chaque changement. Par rapport à
Svelte :

- les actions sont des props à étaler : `<Button {...zeste.actions.denyAll}>` ;
- le brouillon se modifie avec `zeste.setDraft(key, checked)` ;
- une modale contrôlée utilise `open={zeste.preferencesOpen} onOpenChange={zeste.setPreferencesOpen}`.
