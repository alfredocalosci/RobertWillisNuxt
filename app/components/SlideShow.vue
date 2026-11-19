<!-- Auto-advancing horizontal slideshow (replaces jquery.cycle2, 9s timeout).
     The pager is exposed via v-model so it can be rendered elsewhere, as on the original page. -->
<script setup lang="ts">
const props = withDefaults(defineProps<{
  slides: { src: string, alt: string }[]
  interval?: number
}>(), { interval: 9000 })

const index = defineModel<number>({ default: 0 })
const paused = ref(false)

let timer: ReturnType<typeof setInterval> | undefined
function start() {
  stop()
  timer = setInterval(() => {
    if (!paused.value) index.value = (index.value + 1) % props.slides.length
  }, props.interval)
}
function stop() { if (timer) clearInterval(timer) }

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start()
})
onBeforeUnmount(stop)
watch(index, start) // restart the countdown after a manual change
</script>

<template>
  <div
    class="overflow-hidden"
    role="region"
    aria-roledescription="carousel"
    aria-label="Symposium images"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="flex transition-transform duration-1000 ease-in-out motion-reduce:transition-none" :style="{ transform: `translateX(-${index * 100}%)` }">
      <img
        v-for="(s, i) in slides"
        :key="s.src"
        :src="s.src"
        :alt="s.alt"
        class="w-full shrink-0 self-start"
        :aria-hidden="i !== index"
        :loading="i === 0 ? 'eager' : 'lazy'"
      >
    </div>
  </div>
</template>
