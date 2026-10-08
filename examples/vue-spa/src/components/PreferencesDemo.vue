<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useZeste } from '@zeste/vue';
import type { Messages } from '@zeste/services/i18n/types';

const zeste = useZeste<Messages>();
const t = zeste.messages;
const dialog = ref<HTMLDialogElement>();

// The native <dialog> follows `zeste.preferencesOpen` (including Escape / closing).
watchEffect(() => {
  if (zeste.preferencesOpen && !dialog.value?.open) dialog.value?.showModal();
  if (!zeste.preferencesOpen && dialog.value?.open) dialog.value.close();
});
</script>

<template>
  <dialog ref="dialog" aria-labelledby="zeste-prefs-title" @close="zeste.closePreferences">
    <h2 id="zeste-prefs-title">{{ t.title }}</h2>
    <p class="details">{{ t.disclaimer }}</p>

    <fieldset v-for="category in zeste.categories" :key="category.key">
      <legend>{{ t.categories[category.key]?.title ?? category.key }}</legend>
      <p class="details">{{ t.categories[category.key]?.details }}</p>
      <label v-for="service in category.services" :key="service.key">
        <input v-model="zeste.draft[service.key]" type="checkbox" :name="service.key" />
        {{ service.name }}
        <a v-if="service.privacyUrl" :href="service.privacyUrl" target="_blank" rel="noreferrer">
          {{ t.privacyUrl }} {{ t.newWindow }}
        </a>
      </label>
    </fieldset>

    <p v-if="zeste.exempt.length" class="details">
      {{ t.mandatoryTitle }} : {{ zeste.exempt.map((s) => s.name).join(', ') }}
    </p>

    <div class="actions">
      <button type="button" v-bind="zeste.actions.denyAll">{{ t.denyAll }}</button>
      <button type="button" v-bind="zeste.actions.acceptAll">{{ t.acceptAll }}</button>
      <button type="button" v-bind="zeste.actions.savePreferences">{{ t.save }}</button>
    </div>
  </dialog>
</template>
