import type { SitePageKey } from '#shared/types/site'

export const SITE_PAGES: { key: SitePageKey, label: string, short: string, to: string }[] = [
  { key: 'symposium', label: '2016 Symposium', short: '2016 symposium', to: '/' },
  { key: 'library', label: 'Digital Library', short: 'digital library', to: '/Library/' },
  { key: 'about', label: 'About', short: 'About', to: '/about' },
]

export const CONTACT_EMAIL = 'robertwillis.symp.2016@gmail.com'
