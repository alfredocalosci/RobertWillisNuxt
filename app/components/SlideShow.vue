<!-- Auto-advancing horizontal slideshow (replaces jquery.cycle2, 9s timeout).
     The pager is exposed via v-model so it can be rendered elsewhere, as on the original page.
     `v-model:playing` is shared with SlidePager, which renders the pause/play control
     (WCAG 2.2.2). Rotation also holds while hovered and is off by default under reduced motion. -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  slides: { src: string, alt: string }[]
  interval?: number
}>(), { interval: 9000 })

const index = defineModel<number>({ default: 0 })
const playing = defineModel<boolean>('playing', { default: true })
const hovered = ref(false)
const running = computed(() => playing.value && !hovered.value && props.slides.length > 1)

let timer: ReturnType<typeof setInterval> | undefined
function stop() { if (timer) clearInterval(timer) }
function restart() {
  stop()
  if (running.value) {
    timer = setInterval(() => { index.value = (index.value + 1) % props.slides.length }, props.interval)
  }
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) playing.value = false
  restart()
})
onBeforeUnmount(stop)
watch([index, running], restart) // restart the countdown after a manual change or pause/resume
</script>

<template>
  <div
    class="overflow-hidden"
    role="region"
    aria-roledescription="carousel"
    aria-label="Symposium images"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div
      class="flex transition-transform duration-1000 ease-in-out motion-reduce:transition-none mt-4"
      :style="{ transform: `translateX(-${index * 100}%)` }"
      :aria-live="playing ? 'off' : 'polite'"
    >
      <div
        v-for="(s, i) in slides"
        :key="s.src"
        role="group"
        aria-roledescription="slide"
        :aria-label="`${i + 1} of ${slides.length}`"
        :aria-hidden="i !== index"
        class="w-full shrink-0 self-start"
      >
        <img
          :src="s.src"
          :alt="s.alt"
          class="w-full"
          :loading="i === 0 ? 'eager' : 'lazy'"
        >
      </div>
    </div>
  </div>
</template>
