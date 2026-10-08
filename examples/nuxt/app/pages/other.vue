<script setup lang="ts">
import { ConsentGate } from '@zeste/vue';
</script>

<template>
  <h1>Autre page</h1>
  <ConsentGate service="youtube" :embed="{ videoID: 'jNQXAC9IVRw' }" data-testid="video-other" />
</template>
