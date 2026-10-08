import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { parseConsentCookie } from '@zeste/react';
import { Consent } from './Consent.tsx';
import './globals.css';

export const metadata = { title: 'zeste + Next.js' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The choice is read on the server: the first render is already correct (no banner flash).
  const consent = parseConsentCookie((await cookies()).get('tarteaucitron')?.value);
  return (
    <html lang="fr">
      <body>
        <Consent initial={consent}>{children}</Consent>
      </body>
    </html>
  );
}
