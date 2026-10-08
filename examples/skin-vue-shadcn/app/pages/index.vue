<script setup lang="ts">
import { ref } from 'vue';
import { ConsentGate } from '@zeste/vue';

const showSecond = ref(false);
</script>

<template>
  <h1 class="mb-4 text-2xl font-semibold">zeste + Tailwind</h1>

  <ConsentGate service="youtube" :embed="{ videoID: 'dQw4w9WgXcQ', width: 560, height: 315 }" data-testid="video-1">
    <template #placeholder="props"><DemoPlaceholder v-bind="props" /></template>
  </ConsentGate>

  <p class="my-4">
    <button type="button" class="underline underline-offset-2" @click="showSecond = !showSecond">Afficher une 2ᵉ vidéo</button>
  </p>

  <ConsentGate v-if="showSecond" service="youtube" :embed="{ videoID: 'jNQXAC9IVRw' }" data-testid="video-2">
    <template #placeholder="props"><DemoPlaceholder v-bind="props" /></template>
  </ConsentGate>
</template>
