<script setup lang="ts">
useSeoMeta({
  title: 'Robert Willis 2016 | Digital Library',
  description: 'Digital Library of Robert Willis (1800–1875): his publications on science, technology and architecture, as downloadable high-quality PDFs.',
})

const sections: SectionLink[] = [
  { id: 'library', label: 'Science and technology' },
  { id: 'about', label: 'our aim' },
]
</script>

<template>
  <SitePage page="library" :sections="sections" updated="August 2016">
    <section id="intro" class="sezione spaced">
      <SiteCover page="library" />
    </section>

    <section id="library" class="sezione spaced-bottom">
      <h2 class="sr-only">Publications</h2>
      <LibraryList />
    </section>

    <section id="about" class="sezione spaced">
      <div class="row">
        <SectionProse path="library/aim" drop-cap large class="col-span-12 md:col-span-7" />
        <div class="col-span-12 md:col-span-4 md:col-start-9">
          <h2 class="sez">Our Aim</h2>
          <SectionProse path="library/aim-note" class="mt-6 text-[#666]" />
        </div>
      </div>
    </section>
  </SitePage>
</template>
