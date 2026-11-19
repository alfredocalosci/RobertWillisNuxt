<script setup lang="ts">
useSeoMeta({
  title: 'Robert Willis 2016 Symposium',
  description: 'Symposium on Robert Willis (1800–1875): science, technology and architecture in the 19th century. Gonville and Caius College, Cambridge, 16–17 September 2016.',
})

const sections: SectionLink[] = [
  { id: 'intro', label: 'cover' },
  { id: 'call', label: 'call' },
  { id: 'papers', label: 'speakers and subjects' },
  { id: 'caius', label: 'venue' },
]

const slides = [
  { src: '/img/main.png', alt: 'Robert Willis 2016 Symposium' },
  { src: '/img/report.png', alt: 'Page from one of Willis’s reports' },
  { src: '/img/lamina_03.jpg', alt: 'Engraved plate from Willis’s work' },
]
const slide = ref(0)
const playing = ref(true)

const { data: programme } = await useAsyncData('programme', () => queryCollection('programme').first())
</script>

<template>
  <SitePage page="symposium" :sections="sections" updated="May 2016">
    <section id="intro" class="sezione spaced-top">
      <SiteCover page="symposium" />

      <div class="row mt-0 items-center text-center xs:text-right">
        <div class="col-span-12 sm:col-span-3">
          <SlidePager v-model="slide" v-model:playing="playing" :count="slides.length" controls="intro-slides" />
        </div>
        <div class="col-span-12 pr-2 sm:col-span-9">
          <p class="m-0 font-normal text-[#666]">
            <strong class="font-normal text-ink">Cambridge</strong> , Caius College
            <span class="text-blu">·</span> September the 16-17<sup>th</sup> <span class="text-blu">2016</span>
          </p>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-span-12 sm:col-span-10 sm:col-start-2">
          <SlideShow id="intro-slides" v-model="slide" v-model:playing="playing" :slides="slides" />
        </div>
      </div>
    </section>

    <section id="call" class="sezione spaced">
      <SectionProse path="home/call" drop-cap large class="sm:columns-2 sm:gap-[30px] [&>p]:break-inside-avoid" />
    </section>

    <section id="papers" class="sezione spaced">
      <div class="row">
        <div class="col-span-12 sm:col-span-8">
          <template v-for="(g, gi) in programme?.groups" :key="g.theme">
            <p class="font-bold text-blu" :class="{ 'mt-12': gi > 0 }">{{ g.theme }}</p>
            <div v-for="p in g.papers" :key="p.title">
              <p class="mb-1 border-b border-black/5 font-light">{{ p.speaker }}</p>
              <h4 class="mt-0 mb-6 pl-3 font-medium">{{ p.title }}</h4>
            </div>
          </template>
        </div>
        <div class="order-first col-span-12 sm:order-none sm:col-span-3 sm:col-start-10">
          <h2 class="sez">Speakers and subjects</h2>
        </div>
      </div>
    </section>

    <section id="caius" class="sezione">
      <img src="/img/cambridge_caius_d.jpg" alt="Gonville and Caius College, Cambridge" class="h-auto w-full">

      <div class="row spaced-top">
        <SectionProse path="home/venue" class="col-span-12 md:col-span-10 md:col-start-3 md:columns-2 md:gap-[30px]" />
      </div>
    </section>

    <section id="flyer" class="sezione">
      <hr>
      <div class="row">
        <div class="col-span-6 sm:col-span-2 md:col-start-3">
          <a href="/flyer.pdf" target="_blank">
            <img src="/img/flyer.jpg" alt="Symposium flyer" class="portada mt-6 h-auto w-full md:w-5/6">
          </a>
        </div>
        <div class="col-span-6 sm:col-span-3">
          <a href="/Willis_Flyer.pdf" target="_blank">
            <img src="/img/poster.jpg" alt="Symposium poster" class="portada mt-6 h-auto w-full md:w-3/4">
          </a>
        </div>
        <div class="col-span-12 sm:col-span-5">
          <a href="/flyer.pdf" class="cloud mt-12" target="_blank">flyer.pdf [1.6 Mb]</a>
          <a href="/Willis_Flyer.pdf" class="cloud mt-2" target="_blank">poster.pdf [1.2 Mb]</a>
        </div>
      </div>
    </section>
  </SitePage>
</template>
