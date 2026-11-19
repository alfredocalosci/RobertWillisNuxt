// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxt/ui'],
  devtools: { enabled: true },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  // Free substitute for the old Adobe Typekit freight-text-pro, self-hosted at build time.
  fonts: {
    families: [
      { name: 'Crimson Pro', provider: 'google', weights: [300, 400, 500, 600, 700, 800], styles: ['normal', 'italic'] },
    ],
  },

  // Fully static site: no Nuxt UI colour-mode toggle, the original design is light only.
  colorMode: { preference: 'light', fallback: 'light' },

  runtimeConfig: {
    public: {
      // Where the library PDFs live. Same host by default; can point at a bucket/CDN.
      pdfBaseUrl: '/Library/pdf/',
    },
  },

  // Old URLs keep working (prerendered as meta-refresh pages on any static host;
  // public/.htaccess adds real 301s when deployed on Apache).
  // The Digital Library keeps its original URL, /Library/, so no redirect is needed
  // (a lowercase /library route would also collide on case-insensitive filesystems).
  routeRules: {
    '/index.html': { redirect: { to: '/', statusCode: 301 } },
    '/about.html': { redirect: { to: '/about', statusCode: 301 } },
  },

  nitro: {
    prerender: {
      routes: ['/', '/about', '/Library/', '/index.html', '/about.html'],
      crawlLinks: true,
      // PDFs may not be present locally yet; don't fail the build on them.
      ignore: ['/Library/pdf/'],
    },
  },
})
