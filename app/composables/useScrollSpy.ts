/**
 * Tracks which page section is "current", like the old jquery.nav plugin
 * (scrollThreshold 0.25): the last section whose top has crossed 25% of the viewport.
 */
export function useScrollSpy(ids: MaybeRefOrGetter<string[]>, threshold = 0.25) {
  const current = ref(toValue(ids)[0] ?? '')

  function update() {
    const line = window.innerHeight * threshold
    let active = toValue(ids)[0] ?? ''
    for (const id of toValue(ids)) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= line) active = id
    }
    // At the very bottom, the last section is current even if short.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)
      active = toValue(ids).at(-1) ?? active
    current.value = active
  }

  let raf = 0
  const onScroll = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return current
}
