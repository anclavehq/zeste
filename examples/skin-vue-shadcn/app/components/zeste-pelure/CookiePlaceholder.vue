<!--
  Placeholder for blocked content (video, map…), "pelure" style — pass it to <ConsentGate>:
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
  <!-- foreground = black in light mode; in dark mode switch to the card color to avoid a white block -->
  <div class="bg-foreground dark:bg-card grid aspect-video w-full max-w-xl place-items-center rounded-[14px] p-6">
    <div
      class="bg-background text-foreground border-background grid justify-items-center gap-3 rounded-[10px] border-[2.5px] px-5 py-4 text-center shadow-[5px_5px_0_var(--primary)]"
    >
      <p class="text-sm font-semibold">{{ service.name }} {{ t.fallback }}</p>
      <Button
        variant="secondary"
        class="border-foreground h-auto rounded-[10px] border-[2.5px] px-[18px] py-2.5 font-bold shadow-[4px_4px_0_var(--foreground)]"
        @click="allow"
      >
        {{ t.allow }} {{ service.name }}
      </Button>
    </div>
  </div>
</template>
