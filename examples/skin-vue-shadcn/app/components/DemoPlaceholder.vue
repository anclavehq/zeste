<!-- Demo: picks the placeholder of the displayed style. In a real project, import yours directly. -->
<script setup lang="ts">
import type { ServiceState } from '@zeste/vue';
import { CookiePlaceholder as Zeste } from '~/components/zeste';
import { CookiePlaceholder as Pelure } from '~/components/zeste-pelure';

defineProps<{ service: ServiceState; allow: () => void }>();
const Component = useCookie('zeste-style', { decode: (value: string) => value }).value === 'pelure' ? Pelure : Zeste;
</script>

<template>
  <component :is="Component" :service="service" :allow="allow" />
</template>
