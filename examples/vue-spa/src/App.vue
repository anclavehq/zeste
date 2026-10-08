<script setup lang="ts">
import { ref } from 'vue';
import { ConsentGate, createZeste, ZesteProvider } from '@zeste/vue';
import { googleConsentMode } from '@zeste/core';
import { messages } from '@zeste/services/i18n/fr';
import { services } from './consent.ts';
import ConsentBannerDemo from './components/ConsentBannerDemo.vue';
import PreferencesDemo from './components/PreferencesDemo.vue';

// No server: the choice is read from the cookie in the browser.
const zeste = createZeste({
  services: services(),
  plugins: [googleConsentMode()],
  messages,
  // compliance guard: active in dev by default; forced here for the demo and the e2e tests.
  guard: true,
});

const showSecond = ref(false);
</script>

<template>
  <ZesteProvider :zeste="zeste">
    <nav>
      <button type="button" v-bind="zeste.actions.openPreferences">{{ zeste.messages.alertSmall }}</button>
    </nav>
    <main>
      <h1>zeste + Vue</h1>

      <ConsentGate service="youtube" :embed="{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }" data-testid="video-1">
        <template #placeholder="{ service, allow }">
          <div class="placeholder" data-testid="video-1-placeholder">
            <p>Cette vidéo est hébergée par {{ service.name }}.</p>
            <button type="button" @click="allow">Voir la vidéo</button>
          </div>
        </template>
      </ConsentGate>

      <p>
        <button type="button" @click="showSecond = !showSecond">Afficher une 2ᵉ vidéo</button>
      </p>

      <ConsentGate v-if="showSecond" service="youtube" :embed="{ videoID: 'jNQXAC9IVRw' }" data-testid="video-2" />
    </main>
    <ConsentBannerDemo />
    <PreferencesDemo />
  </ZesteProvider>
</template>
