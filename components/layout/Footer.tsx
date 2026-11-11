import {site} from '@/content/site'

export default function Footer() {
  return (
    <footer className="px-5 md:px-10 py-10 meta flex justify-between">
      <span>ZETA — BUENOS AIRES</span>
      <a href={`https://instagram.com/${site.ig}`}>@{site.ig}</a>
    </footer>
  )
}
