import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // Digital Library: one YAML file per publication (migrated from MySQL `library_rw`).
    library: defineCollection({
      type: 'data',
      source: 'library/*.yml',
      schema: z.object({
        legacyId: z.number(), // id_lib — keeps the original ordering tie-break
        year: z.number(), // anno_lib
        author: z.string().nullable(), // autor_lib
        title: z.string(), // title_lib
        publication: z.string().nullable(), // txt_lib
        category: z.string().nullable(), // cat_lib
        file: z.string().nullable(), // file_lib → /Library/pdf/<file>
        archiveId: z.string().optional(), // Internet Archive item holding the PDF (set by scripts/ia-upload.mjs)
        cover: z.string().nullable(), // img_lib → /Library/img/<cover>
        sizeMb: z.number(), // size_lib
        hidden: z.boolean(), // hide_lib
      }),
    }),

    // Prose blocks of each page, one Markdown file per page section.
    sections: defineCollection({
      type: 'page',
      source: 'sections/**/*.md',
    }),

    // Symposium programme: speakers grouped by theme.
    programme: defineCollection({
      type: 'data',
      source: 'programme.yml',
      schema: z.object({
        groups: z.array(z.object({
          theme: z.string(),
          papers: z.array(z.object({ speaker: z.string(), title: z.string() })),
        })),
      }),
    }),
  },
})
