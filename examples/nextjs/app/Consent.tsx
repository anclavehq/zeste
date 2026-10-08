'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { createZeste, ZesteProvider } from '@zeste/react';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { services } from './consent.ts';
import { Banner } from './Banner.tsx';
import { Preferences } from './Preferences.tsx';

export function Consent({ initial, children }: { initial: Record<string, string>; children: ReactNode }) {
  // One instance per request on the server, one per page in the browser: never at module level.
  const [zeste] = useState(() =>
    createZeste({
      services: services(),
      initial,
      plugins: [googleConsentMode()],
      messages,
      // compliance guard: active in dev by default; forced here for the demo and the e2e tests.
      guard: true,
    }),
  );

  return (
    <ZesteProvider zeste={zeste}>
      <nav>
        <Link href="/">Accueil</Link>
        <Link href="/other">Autre page</Link>
        <button type="button" {...zeste.actions.openPreferences}>
          {zeste.messages.alertSmall}
        </button>
      </nav>
      <main>{children}</main>
      <Banner />
      <Preferences />
    </ZesteProvider>
  );
}
