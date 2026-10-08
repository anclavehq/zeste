'use client';

/*
 * Headless banner: only rendered if the visitor has not chosen yet (including during server rendering).
 * The content and style are yours; spread the actions on your buttons:
 * <Button {...zeste.actions.denyAll}>…</Button>
 */
import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { auditBanner, reportIssues, whenSettled } from '@zeste/core';
import { useZeste } from './context.ts';

export interface ConsentBannerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function ConsentBanner({ children, ...rest }: ConsentBannerProps) {
  const zeste = useZeste();
  const [element, setElement] = useState<HTMLElement | null>(null);

  // compliance guard: audits the real render, once layout is done and animations have finished.
  useEffect(() => {
    if (!zeste.guard || !element) return;
    let cancelled = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        await whenSettled(element);
        if (!cancelled && element.isConnected) reportIssues(auditBanner(element));
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [zeste, element]);

  if (!zeste.showBanner) return null;

  return (
    <section ref={setElement} aria-label="Cookies" {...rest} data-zeste-banner="">
      {children}
    </section>
  );
}
