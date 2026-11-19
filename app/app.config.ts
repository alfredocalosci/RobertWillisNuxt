export default defineAppConfig({
  ui: {
    prose: {
      // Nuxt UI's default paragraph spacing is my-5; use bottom-only spacing instead
      p: {
        base: 'mt-0 mb-6',
      },
    },
  },
})
