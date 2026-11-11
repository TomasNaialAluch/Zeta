import {projects} from '@/content/projects'
import {site} from '@/content/site'

export default function sitemap() {
  const paths = ['', '/work', '/about', '/contact', ...projects.map((p) => `/work/${p.slug}`)]
  return paths.map((path) => ({url: site.url + path}))
}
