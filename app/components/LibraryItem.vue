<script setup lang="ts">
import type { LibraryCollectionItem } from '@nuxt/content'

const props = defineProps<{ item: LibraryCollectionItem }>()
const { pdfBaseUrl } = useRuntimeConfig().public
const href = computed(() => props.item.file ? pdfBaseUrl + encodeURIComponent(props.item.file) : undefined)
</script>

<template>
  <li class="flow-root pt-3" itemscope itemtype="https://schema.org/Book">
    <figure class="float-left mt-6 w-[12%] text-center">
      <a v-if="item.cover" :href="href" itemprop="url">
        <img
          :src="`/Library/img/${item.cover}`"
          :alt="item.title"
          class="portada h-auto w-full"
          loading="lazy"
        >
      </a>
    </figure>

    <div class="pl-[26%]">
      <div v-if="item.author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <p class="m-0 pt-6 pr-2 font-light" itemprop="name">{{ item.author }}</p>
      </div>
      <p v-else class="m-0 pt-6" aria-hidden="true">&nbsp;</p>
      <h4 class="mb-0 font-semibold text-2xl/6" itemprop="name">{{ item.title }}</h4>
      <p v-if="item.publication?.trim()" class="mb-2 text-base"><em>{{ item.publication }}</em></p>

      <a v-if="href" :href="href" class="cloud float-right mt-2" itemprop="url" target="_blank" rel="noopener">
        download [<em class="px-1">{{ item.sizeMb.toFixed(2) }} Mb </em>]
      </a>
      <p class="mb-0 mt-2 text-blu font-semibold" itemprop="bookEdition">{{ item.year }}</p>
    </div>
  </li>
</template>
