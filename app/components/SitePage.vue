<!-- Page shell: sidebar (≥1200px) + content + footer. -->
<script setup lang="ts">
defineProps<{
  page: SitePageKey
  sections: SectionLink[]
  updated: string
}>()
</script>

<template>
  <div>
    <SiteSidebar :page="page" :sections="sections" :updated="updated" />
    <main>
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
