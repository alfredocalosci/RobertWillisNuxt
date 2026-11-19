<!-- Searchable, sortable list of the Digital Library (replaces list.js). -->
<script setup lang="ts">
type SortKey = 'year' | 'title' | 'author'

const { data: items } = await useAsyncData('library', () =>
  queryCollection('library').where('hidden', '=', false).order('year', 'ASC').order('legacyId', 'ASC').all(),
)

const search = ref('')
const sort = ref<{ key: SortKey, dir: 1 | -1 }>({ key: 'year', dir: 1 })

const SORTS: { key: SortKey, label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
]

function toggle(key: SortKey) {
  sort.value = sort.value.key === key
    ? { key, dir: sort.value.dir === 1 ? -1 : 1 }
    : { key, dir: 1 }
}

const norm = (s: string | null | undefined) =>
  (s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

const visible = computed(() => {
  const q = norm(search.value).trim()
  const list = (items.value ?? []).filter(i =>
    !q || [i.author, i.title, String(i.year)].some(f => norm(f).includes(q)),
  )
  const { key, dir } = sort.value
  return list.toSorted((a, b) => {
    const c = key === 'year'
      ? a.year - b.year || a.legacyId - b.legacyId
      : norm(a[key]).localeCompare(norm(b[key]))
    return c * dir
  })
})
</script>

<template>
  <div>
    <div class="row mb-3 items-end">
      <div class="col-span-12 md:col-span-7">
        <UInput
          v-model="search"
          variant="none"
          placeholder="search"
          aria-label="Search the library by author, title or year"
          class="w-full"
          :ui="{ base: 'px-0 py-1 border-b border-black/15 rounded-none bg-transparent text-base text-ink placeholder:text-black/40' }"
        />
      </div>
      <div class="col-span-12 md:col-span-5">
        <p class="m-0 flex items-center border-b border-black/15 pb-0.5 text-[#999]">
          <span class="mr-auto">order by:</span>
          <button
            v-for="s in SORTS"
            :key="s.key"
            type="button"
            class="sort-pill"
            :class="{ active: sort.key === s.key }"
            :aria-pressed="sort.key === s.key"
            @click="toggle(s.key)"
          >
            {{ s.label }}
            <UIcon
              v-if="sort.key === s.key"
              :name="sort.dir === 1 ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'"
              class="size-3 align-[-1px]"
            />
          </button>
        </p>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ visible.length }} publications</p>

    <ul class="m-0 list-none p-0">
      <LibraryItem v-for="item in visible" :key="item.legacyId" :item="item" />
    </ul>

    <p v-if="!visible.length" class="pt-6 italic text-[#666]">No publications match “{{ search }}”.</p>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.sort-pill {
  @apply ml-1 cursor-pointer rounded-xl border border-double border-white bg-black/5 px-3 text-[.8em] font-normal uppercase text-black/50 hover:bg-black/20;
}
.sort-pill.active { @apply bg-blu font-bold text-white; }
</style>
