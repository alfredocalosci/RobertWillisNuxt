<!-- Slide picker + pause/play for SlideShow. Pass the slideshow's id as `controls`.
     Keyboard focus entering the pager stops rotation (WAI-ARIA APG carousel); mouse clicks don't. -->
<script setup lang="ts">
defineProps<{ count: number, controls?: string }>()
const index = defineModel<number>({ default: 0 })
const playing = defineModel<boolean>('playing', { default: true })

function onFocusIn(e: FocusEvent) {
  const root = e.currentTarget as HTMLElement
  const enteredFromOutside = !root.contains(e.relatedTarget as Node | null)
  if (enteredFromOutside && (e.target as HTMLElement).matches(':focus-visible')) playing.value = false
}
</script>

<template>
  <div class="flex items-center gap-2 xs:justify-start justify-center" @focusin="onFocusIn">
    <div role="group" aria-label="Choose slide" class="flex items-center gap-2">
      <button
        v-for="i in count"
        :key="i"
        type="button"
        class="size-4 cursor-pointer rounded-full transition-colors"
        :class="index === i - 1 ? 'bg-teal' : 'bg-white hover:bg-teal/60'"
        :aria-label="`Show image ${i}`"
        :aria-current="index === i - 1 ? 'true' : undefined"
        :aria-controls="controls"
        @click="index = i - 1"
      />
    </div>

    <button
      type="button"
      class="ml-1 grid size-4 cursor-pointer place-items-center text-[#999] transition-colors hover:text-blu"
      :aria-label="playing ? 'Pause slideshow' : 'Play slideshow'"
      :aria-controls="controls"
      @click="playing = !playing"
    >
      <svg v-if="playing" viewBox="0 0 16 16" class="size-3" fill="currentColor" aria-hidden="true">
        <rect x="3" y="2" width="3.5" height="12" rx="1" />
        <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
      </svg>
      <svg v-else viewBox="0 0 16 16" class="size-3" fill="currentColor" aria-hidden="true">
        <path d="M4 2.5v11a.75.75 0 0 0 1.14.64l9-5.5a.75.75 0 0 0 0-1.28l-9-5.5A.75.75 0 0 0 4 2.5Z" />
      </svg>
    </button>
  </div>
</template>
