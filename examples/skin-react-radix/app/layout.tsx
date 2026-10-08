import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { parseConsentCookie } from '@zeste/react';
import { Shell } from './Shell.tsx';
import './globals.css';

export const metadata = { title: 'zeste + Tailwind' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  // The choice is read on the server: the first render is already correct (no banner flash).
  // `zeste-style` and `zeste-theme` are only for the demo, to compare styles and themes.
  const consent = parseConsentCookie(jar.get('tarteaucitron')?.value);
  const style = jar.get('zeste-style')?.value === 'pelure' ? 'pelure' : 'zeste';
  const theme = jar.get('zeste-theme')?.value === 'dark' ? 'dark' : 'light';
  return (
    <html lang="fr" className={theme === 'dark' ? 'dark' : undefined}>
      <body>
        <Shell initial={consent} style={style} theme={theme}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
