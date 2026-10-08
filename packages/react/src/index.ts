export { Zeste, createZeste, type ActionProps, type CategoryState, type ZesteOptions } from './zeste.ts';
export { useZeste } from './context.ts';
export { ZesteProvider, type ZesteProviderProps } from './ZesteProvider.tsx';
export { ConsentGate, type ConsentGateProps, type PlaceholderProps } from './ConsentGate.tsx';
export { ConsentBanner, type ConsentBannerProps } from './ConsentBanner.tsx';
export { parseConsentCookie } from '@zeste/core';
export type { ConsentOptions, ServiceDefinition, ServiceState, ConsentStatus, ZesteMessages, ConsentAction } from '@zeste/core';
