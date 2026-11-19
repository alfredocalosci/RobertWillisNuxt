<script setup lang="ts">
defineProps<{ count: number }>()
const index = defineModel<number>({ default: 0 })
</script>

<template>
  <div class="flex gap-1 xs:justify-start justify-center">
    <button
      v-for="i in count"
      :key="i"
      type="button"
      class="cursor-pointer text-[2em] leading-[.75em]"
      :class="index === i - 1 ? 'text-teal' : 'text-white'"
      :aria-label="`Show image ${i}`"
      :aria-pressed="index === i - 1"
      @click="index = i - 1"
    >
      •
    </button>
  </div>
</template>
