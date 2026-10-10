---
title: Next.js
description: Set up zeste in a Next.js app (App Router), with the choice read on the server.
---

## 1. Install and declare your services

```sh
npm install @zeste/react @zeste/core @zeste/services
npx zeste init
```

`zeste init` writes `lib/consent.ts` (in `src/` if the project has one) with the services it finds. You can also
write it yourself:

```ts
// lib/consent.ts
import { gtag, youtube } from '@zeste/services';

export const services = () => [gtag({ gtagUa: 'G-XXXXXXX' }), youtube()];
```

## 2. Read the choice on the server

```tsx
// app/layout.tsx (server component)
import { cookies } from 'next/headers';
import { parseConsentCookie } from '@zeste/react';
import { Consent } from './Consent';

export default async function RootLayout({ children }) {
  const consent = parseConsentCookie((await cookies()).get('tarteaucitron')?.value);
  return (
    <html lang="en">
      <body>
        <Consent initial={consent}>{children}</Consent>
      </body>
    </html>
  );
}
```

## 3. Generate the interface

```sh
npx zeste add                 # detects Radix, Ark UI or shadcn/ui
npx zeste add --style pelure
```

This writes `CookieBanner`, `CookiePreferences` and `CookiePlaceholder` into `components/zeste/`.

## 4. Add zeste to your layout

```tsx
// app/Consent.tsx
'use client';
import { useState } from 'react';
import { createZeste, ZesteProvider } from '@zeste/react';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/en';
import { CookieBanner, CookiePreferences } from '@/components/zeste';
import { services } from '@/lib/consent';

export function Consent({ initial, children }) {
  // One instance per request on the server, one per page in the browser: never at module level.
  const [zeste] = useState(() =>
    createZeste({ services: services(), initial, plugins: [googleConsentMode()], messages }),
  );
  return (
    <ZesteProvider zeste={zeste}>
      {children}
      <CookieBanner />
      <CookiePreferences />
      {/* A permanent link to change one's mind: required by EU consent rules */}
      <button {...zeste.actions.openPreferences}>Cookie settings</button>
    </ZesteProvider>
  );
}
```

In a child component, `useZeste()` returns the same object and re-renders on every change. Compared with Svelte:

- actions are props to spread: `<Button {...zeste.actions.denyAll}>`;
- the draft is edited with `zeste.setDraft(key, checked)`;
- a controlled dialog uses `open={zeste.preferencesOpen} onOpenChange={zeste.setPreferencesOpen}`.
