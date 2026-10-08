import { createContext } from 'svelte';
import type { ZesteMessages } from '@zeste/core';
import type { Zeste } from './zeste.svelte.ts';

const [get, set] = createContext<Zeste<ZesteMessages>>();

/**
 * Returns the zeste instance provided by the nearest `<ZesteProvider>`.
 * Pass the type of your messages to get them typed: `getZeste<Messages>()`.
 */
export function getZeste<M extends ZesteMessages = ZesteMessages>(): Zeste<M> {
  // The context does not keep the messages type: the caller specifies it.
  return get() as Zeste<M>;
}

export const setZeste = set;
