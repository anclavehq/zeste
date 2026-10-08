'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { auditReopen, reportIssues, type ZesteMessages } from '@zeste/core';
import { ZesteContext } from './context.ts';
import type { Zeste } from './zeste.ts';

export interface ZesteProviderProps {
  zeste: Zeste<ZesteMessages>;
  children: ReactNode;
}

export function ZesteProvider({ zeste, children }: ZesteProviderProps) {
  useEffect(() => {
    zeste.retain();
    return zeste.release;
  }, [zeste]);

  useSyncExternalStore(zeste.subscribe, zeste.getState, zeste.getState);
  const audit = zeste.guard && zeste.decided;

  // compliance guard: once the choice is made, a button must allow changing it.
  useEffect(() => {
    if (!audit) return;
    const timer = setTimeout(() => reportIssues(auditReopen()), 1000);
    return () => clearTimeout(timer);
  }, [audit]);

  return <ZesteContext.Provider value={zeste}>{children}</ZesteContext.Provider>;
}
