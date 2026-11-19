<!-- Title block + page links shown below 1200px (was #cover and #blocks). -->
<script setup lang="ts">
defineProps<{ page: SitePageKey }>()
</script>

<template>
  <div>
    <div class="mx-auto w-[254px] border-b border-black/5 xs:mx-0 xs:border-b-0 lg:hidden">
      <SiteTitle />
    </div>

    <div class="row">
      <nav aria-label="Pages" class="col-span-12 text-center font-light text-[#999] xs:text-right sm:col-span-8 sm:col-start-5">
        <h6
          v-for="p in SITE_PAGES"
          :key="p.key"
          class="block-link mx-2 mt-3 block border-b border-black/5 pb-2 font-light uppercase xs:inline-block xs:border-b-0 xs:pb-0 lg:mt-0"
        >
          <NuxtLink
            :to="p.to"
            :class="p.key === page ? 'font-medium text-blu' : 'text-[#666] hover:text-blu'"
            class="hover:no-underline"
            :aria-current="p.key === page ? 'page' : undefined"
          >
            {{ p.short }}
          </NuxtLink>
        </h6>
      </nav>
    </div>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

@variant xs {
  .block-link:not(:last-child)::after { content: " | "; @apply pl-2; }
}
</style>
