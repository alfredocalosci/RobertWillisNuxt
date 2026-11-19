<!-- MDC: ::content-figure{src="/img/x.png" alt="…"} optional caption in the default slot -->
<script setup lang="ts">
defineProps<{ src: string, alt: string }>()
</script>

<template>
  <figure class="mb-6">
    <img :src="src" :alt="alt" loading="lazy">
    <figcaption v-if="$slots.default">
      <slot mdc-unwrap="p" />
    </figcaption>
  </figure>
</template>
