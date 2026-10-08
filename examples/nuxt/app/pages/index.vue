<script setup lang="ts">
import { ref } from 'vue';
import { ConsentGate } from '@zeste/vue';

const showSecond = ref(false);
</script>

<template>
  <h1>zeste + Nuxt</h1>

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
</template>
