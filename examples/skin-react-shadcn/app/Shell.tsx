'use client';

import { createContext, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { createZeste, ZesteProvider } from '@zeste/react';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import * as zesteStyle from '@/components/zeste';
import * as pelureStyle from '@/components/zeste-pelure';
import { services } from './consent.ts';

type Style = 'zeste' | 'pelure';

/** Demo: the style picked by cookie, for the placeholders. */
export const StyleContext = createContext<Style>('zeste');

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1 ${active ? 'border-stone-900 font-semibold dark:border-stone-100' : 'border-stone-300 dark:border-stone-600'}`;

interface ShellProps {
  initial: Record<string, string>;
  style: Style;
  theme: 'light' | 'dark';
  children: ReactNode;
}

export function Shell({ initial, style, theme, children }: ShellProps) {
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

  // Demo: two generated styles (`zeste add` and `zeste add --style pelure`), pick either.
  const skin = style === 'pelure' ? pelureStyle : zesteStyle;
  const setDemo = (name: 'zeste-style' | 'zeste-theme', value: string) => {
    document.cookie = `${name}=${value}; path=/; samesite=lax`;
    location.reload();
  };

  return (
    <ZesteProvider zeste={zeste}>
      <StyleContext.Provider value={style}>
        <header className="flex flex-wrap items-center gap-4 border-b border-stone-200 p-4 text-stone-900 dark:border-stone-800 dark:text-stone-100">
          <Link href="/" className="underline-offset-2 hover:underline">
            Accueil
          </Link>
          <Link href="/other" className="underline-offset-2 hover:underline">
            Autre page
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm" role="group" aria-label="Style de la démo">
            <span className="text-stone-600 dark:text-stone-400">Style :</span>
            {(['zeste', 'pelure'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={pill(style === value)}
                aria-pressed={style === value}
                onClick={() => setDemo('zeste-style', value)}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm" role="group" aria-label="Thème de la démo">
            {(
              [
                ['light', 'clair'],
                ['dark', 'sombre'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={pill(theme === value)}
                aria-pressed={theme === value}
                onClick={() => setDemo('zeste-theme', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-3xl p-4 text-stone-900 dark:text-stone-100">{children}</main>
        <footer className="border-t border-stone-200 p-4 text-sm dark:border-stone-800 dark:text-stone-100">
          {/* Permanent link to change one's choices (required by EU consent rules) */}
          <button type="button" className="underline underline-offset-2" {...zeste.actions.openPreferences}>
            {zeste.messages.alertSmall}
          </button>
        </footer>
        <skin.CookieBanner />
        <skin.CookiePreferences />
      </StyleContext.Provider>
    </ZesteProvider>
  );
}
