import { inject, provide, type InjectionKey } from 'vue';
import type { ZesteMessages } from '@zeste/core';
import type { Zeste } from './zeste.ts';

const KEY: InjectionKey<Zeste<ZesteMessages>> = Symbol('zeste');

/**
 * Returns the zeste instance provided by the nearest `<ZesteProvider>`.
 * Pass the type of your messages to get them typed: `useZeste<Messages>()`.
 */
export function useZeste<M extends ZesteMessages = ZesteMessages>(): Zeste<M> {
  const zeste = inject(KEY, null);
  if (!zeste) throw new Error('[zeste] useZeste() must be called inside <ZesteProvider>.');
  // The injection does not keep the messages type: the caller specifies it.
  return zeste as Zeste<M>;
}

export const provideZeste = (zeste: Zeste<ZesteMessages>) => provide(KEY, zeste);
