<script setup lang="ts">
import { ConsentBanner, useZeste } from '@zeste/vue';
import type { Messages } from '@zeste/services/i18n/types';

const zeste = useZeste<Messages>();
const t = zeste.messages;
const reload = () => location.reload();
</script>

<template>
  <div v-if="zeste.needsReload" class="reload" role="status">
    Vos choix seront entièrement appliqués après rechargement.
    <button type="button" @click="reload">{{ t.reload }}</button>
  </div>

  <!-- ConsentBanner is only rendered if the visitor has not chosen yet -->
  <ConsentBanner class="zeste-banner" :aria-label="t.icon" data-testid="banner">
    <p>{{ t.alertBigPrivacy }}</p>
    <div class="actions">
      <!-- Same visual weight for refusing and accepting (EU consent guidance) -->
      <button type="button" v-bind="zeste.actions.denyAll">{{ t.denyAll }}</button>
      <button type="button" v-bind="zeste.actions.openPreferences">{{ t.personalize }}</button>
      <button type="button" v-bind="zeste.actions.acceptAll">{{ t.acceptAll }}</button>
    </div>
  </ConsentBanner>
</template>
