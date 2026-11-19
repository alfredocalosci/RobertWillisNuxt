<!-- Renders one Markdown file from content/sections/<path>.md -->
<script setup lang="ts">
const props = defineProps<{ path: string, dropCap?: boolean, large?: boolean }>()

const { data } = await useAsyncData(`section-${props.path}`, () =>
  queryCollection('sections').path(`/sections/${props.path}`).first(),
)
</script>

<template>
  <ContentRenderer
    v-if="data"
    :value="data"
    class="prose-rw"
    :class="{ 'drop-cap': dropCap, large }"
  />
</template>
