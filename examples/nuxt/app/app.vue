<script setup lang="ts">
import { createZeste, parseConsentCookie, ZesteProvider } from '@zeste/vue';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { services } from './consent';

// The choice is read from the cookie, on the server too: the first render is already correct (no banner flash).
const cookie = useCookie('tarteaucitron', { decode: (value) => value });

// One instance per request on the server, one per page in the browser: never at module level.
const zeste = createZeste({
  services: services(),
  initial: parseConsentCookie(cookie.value),
  plugins: [googleConsentMode()],
  messages,
  // compliance guard: active in dev by default; forced here for the demo and the e2e tests.
  guard: true,
});
</script>

<template>
  <ZesteProvider :zeste="zeste">
    <nav>
      <NuxtLink to="/">Accueil</NuxtLink>
      <NuxtLink to="/other">Autre page</NuxtLink>
      <button type="button" v-bind="zeste.actions.openPreferences">{{ zeste.messages.alertSmall }}</button>
    </nav>
    <main><NuxtPage /></main>
    <ConsentBannerDemo />
    <PreferencesDemo />
  </ZesteProvider>
</template>
