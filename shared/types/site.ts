/** An in-page section listed in the sidebar nav (scroll-spied). */
export interface SectionLink {
  id: string
  label: string
}

/** Top-level pages of the site. */
export type SitePageKey = 'symposium' | 'library' | 'about'
