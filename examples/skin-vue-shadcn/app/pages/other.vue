<script setup lang="ts">
import { ConsentGate } from '@zeste/vue';
</script>

<template>
  <h1 class="mb-4 text-2xl font-semibold">Autre page</h1>
  <ConsentGate service="youtube" :embed="{ videoID: 'jNQXAC9IVRw' }" data-testid="video-other">
    <template #placeholder="props"><DemoPlaceholder v-bind="props" /></template>
  </ConsentGate>
</template>
