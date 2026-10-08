'use client';

import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ZesteMessages } from '@zeste/core';
import type { Zeste } from './zeste.ts';

export const ZesteContext = createContext<Zeste<ZesteMessages> | null>(null);

/**
 * Returns the zeste instance provided by the nearest `<ZesteProvider>`, and re-renders
 * the component on every change. Pass the type of your messages to get them typed: `useZeste<Messages>()`.
 */
export function useZeste<M extends ZesteMessages = ZesteMessages>(): Zeste<M> {
  const zeste = useContext(ZesteContext);
  if (!zeste) throw new Error('[zeste] useZeste() must be called inside <ZesteProvider>.');
  useSyncExternalStore(zeste.subscribe, zeste.getState, zeste.getState);
  // The context does not keep the messages type: the caller specifies it.
  return zeste as Zeste<M>;
}
