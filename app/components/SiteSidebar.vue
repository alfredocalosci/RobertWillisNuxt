<!-- Fixed left column shown at ≥1200px (was section#fijo). -->
<script setup lang="ts">
const props = defineProps<{
  page: SitePageKey
  sections: SectionLink[]
  updated: string
}>()

const current = useScrollSpy(() => props.sections.map(s => s.id))
</script>

<template>
  <aside class="fixed inset-y-0 left-0 z-10 hidden w-[320px] overflow-y-auto border-r border-white/75 p-12 lg:block">
    <header>
      <SiteTitle />
    </header>

    <nav aria-label="Site" class="mt-12 border-4 border-double border-white/75 bg-black/[.025] py-3">
      <ul class="m-0 list-none p-0 text-center text-[1.2em]">
        <template v-for="(p, i) in SITE_PAGES" :key="p.key">
          <li v-if="i > 0" aria-hidden="true">
            <hr class="mx-auto my-3 w-4/5 border-white/75">
          </li>
          <li class="py-1 text-[.8em] leading-[1.5em]">
            <NuxtLink
              :to="p.to"
              class="nav-link block uppercase not-italic"
              :class="p.key === page ? 'nav-page-active' : ''"
              :aria-current="p.key === page ? 'page' : undefined"
            >
              {{ p.label }}
            </NuxtLink>
          </li>
          <template v-if="p.key === page">
            <li aria-hidden="true">
              <hr class="mx-auto my-3 w-4/5 border-white/75">
            </li>
            <li v-for="s in sections" :key="s.id" class="leading-[1.333em]">
              <a
                :href="`#${s.id}`"
                class="nav-link block italic"
                :class="{ 'nav-current': current === s.id }"
              >{{ s.label }}</a>
            </li>
          </template>
        </template>
      </ul>
    </nav>

    <p class="my-4 text-center text-[.8em] leading-[2em]">
      latest update: <span class="font-bold text-blu">{{ updated }}</span>
    </p>
  </aside>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.nav-link { @apply font-normal text-[#666] no-underline hover:text-black hover:no-underline; }
.nav-page-active { @apply font-semibold text-ink; }
.nav-page-active::before { content: "···  "; @apply pr-2 font-semibold text-blu; white-space: pre; }
.nav-page-active::after { content: "  ···"; @apply pl-2 font-semibold text-blu; white-space: pre; }
.nav-current { @apply font-medium text-ink; }
.nav-current::before { content: "- "; @apply text-blu; white-space: pre; }
.nav-current::after { content: " -"; @apply text-blu; white-space: pre; }
</style>
