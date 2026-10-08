<script setup lang="ts">
import { createZeste, parseConsentCookie, ZesteProvider } from '@zeste/vue';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import * as zesteStyle from '~/components/zeste';
import * as pelureStyle from '~/components/zeste-pelure';
import { services } from './consent';

// The choice is read from the cookie, on the server too: the first render is already correct (no banner flash).
// `zeste-style` and `zeste-theme` are only for the demo, to compare styles and themes.
const raw = { decode: (value: string) => value };
const consent = useCookie('tarteaucitron', raw);
const style = useCookie('zeste-style', raw).value === 'pelure' ? 'pelure' : 'zeste';
const theme = useCookie('zeste-theme', raw).value === 'dark' ? 'dark' : 'light';
useHead({ htmlAttrs: { lang: 'fr', class: theme === 'dark' ? 'dark' : undefined } });

const zeste = createZeste({
  services: services(),
  initial: parseConsentCookie(consent.value),
  plugins: [googleConsentMode()],
  messages,
  // compliance guard: active in dev by default; forced here for the demo and the e2e tests.
  guard: true,
});

// Demo: two generated styles (`zeste add` and `zeste add --style pelure`), pick either.
const skin = style === 'pelure' ? pelureStyle : zesteStyle;
const setDemo = (name: 'zeste-style' | 'zeste-theme', value: string) => {
  document.cookie = `${name}=${value}; path=/; samesite=lax`;
  location.reload();
};
const pill = (active: boolean) =>
  `rounded-full border px-3 py-1 ${active ? 'border-stone-900 font-semibold dark:border-stone-100' : 'border-stone-300 dark:border-stone-600'}`;
const themes = [
  ['light', 'clair'],
  ['dark', 'sombre'],
] as const;
</script>

<template>
  <ZesteProvider :zeste="zeste">
    <header class="flex flex-wrap items-center gap-4 border-b border-stone-200 p-4 text-stone-900 dark:border-stone-800 dark:text-stone-100">
      <NuxtLink to="/" class="underline-offset-2 hover:underline">Accueil</NuxtLink>
      <NuxtLink to="/other" class="underline-offset-2 hover:underline">Autre page</NuxtLink>
      <div class="ml-auto flex items-center gap-2 text-sm" role="group" aria-label="Style de la démo">
        <span class="text-stone-600 dark:text-stone-400">Style :</span>
        <button
          v-for="value in ['zeste', 'pelure']"
          :key="value"
          type="button"
          :class="pill(style === value)"
          :aria-pressed="style === value"
          @click="setDemo('zeste-style', value)"
        >
          {{ value }}
        </button>
      </div>
      <div class="flex items-center gap-2 text-sm" role="group" aria-label="Thème de la démo">
        <button
          v-for="[value, label] in themes"
          :key="value"
          type="button"
          :class="pill(theme === value)"
          :aria-pressed="theme === value"
          @click="setDemo('zeste-theme', value)"
        >
          {{ label }}
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-3xl p-4 text-stone-900 dark:text-stone-100"><NuxtPage /></main>
    <footer class="border-t border-stone-200 p-4 text-sm dark:border-stone-800 dark:text-stone-100">
      <!-- Permanent link to change one's choices (required by EU consent rules) -->
      <button type="button" class="underline underline-offset-2" v-bind="zeste.actions.openPreferences">
        {{ zeste.messages.alertSmall }}
      </button>
    </footer>
    <component :is="skin.CookieBanner" />
    <component :is="skin.CookiePreferences" />
  </ZesteProvider>
</template>
