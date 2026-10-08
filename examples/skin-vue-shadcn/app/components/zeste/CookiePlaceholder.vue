<!--
  Placeholder for blocked content (video, map…), "zeste" style — pass it to <ConsentGate>:
  <template #placeholder="props"><CookiePlaceholder v-bind="props" /></template>
-->
<script setup lang="ts">
import { useZeste, type ServiceState } from '@zeste/vue';
import type { Messages } from '@zeste/services/i18n/types';
import { Button } from '@/components/ui/button';

defineProps<{
  service: ServiceState;
  allow: () => void;
}>();

const t = useZeste<Messages>().messages;
</script>

<template>
  <div class="zeste-sunburst grid aspect-video w-full max-w-xl place-items-center rounded-2xl p-6">
    <div class="bg-popover text-popover-foreground grid justify-items-center gap-3 rounded-xl px-5 py-4 text-center shadow-lg">
      <p class="text-sm">{{ service.name }} {{ t.fallback }}</p>
      <Button @click="allow">{{ t.allow }} {{ service.name }}</Button>
    </div>
  </div>
</template>

<style scoped>
/* Citrus slice in the background, in the theme's primary color */
.zeste-sunburst {
  background: repeating-conic-gradient(
    from 0deg at 50% 50%,
    color-mix(in oklab, var(--primary) 22%, var(--background)) 0 10deg,
    color-mix(in oklab, var(--primary) 8%, var(--background)) 10deg 20deg
  );
}
</style>
