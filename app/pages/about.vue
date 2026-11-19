<script setup lang="ts">
useSeoMeta({
  title: 'About Robert Willis | Robert Willis 2016 Symposium',
  description: 'Robert Willis (1800–1875): life and works of the nineteenth-century polymath, from mechanism and the study of sound to medieval architecture.',
})

const sections: SectionLink[] = [
  { id: 'intro', label: 'cover' },
  { id: 'about', label: 'this web site' },
  { id: 'life', label: 'life and works' },
]
</script>

<template>
  <SitePage page="about" :sections="sections" updated="May 2016">
    <section id="intro" class="sezione spaced">
      <SiteCover page="about" />
      <img src="/img/eswn.png" alt="" class="mt-6 h-auto w-full">
    </section>

    <section id="about" class="sezione spaced">
      <div class="row">
        <SectionProse path="about/website" drop-cap large class="col-span-12 md:col-span-7" />
        <div class="col-span-12 md:col-span-4 md:col-start-9">
          <h2 class="sez sez-loose">This web site</h2>
          <figure class="mb-6">
            <img src="/img/willis.jpg" alt="Portrait of Robert Willis">
            <figcaption>Robert Willis</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section id="life" class="sezione spaced">
      <div class="row">
        <SectionProse path="about/life-intro" drop-cap large class="col-span-12 md:col-span-7" />
        <div class="order-first col-span-12 md:order-none md:col-span-4 md:col-start-9">
          <h2 class="sez sez-loose">Life and Works</h2>
        </div>
      </div>

      <figure class="mb-6">
        <img src="/img/turkish.png" alt="Drawing of the chess-playing automaton known as The Turk" loading="lazy">
        <figcaption>from the study of the famous chess-playing ‘automaton’, known as ’The Turk’</figcaption>
      </figure>

      <div class="row">
        <SectionProse path="about/life" large class="col-span-12 md:col-span-10 md:col-start-3" />
      </div>
    </section>
  </SitePage>
</template>
