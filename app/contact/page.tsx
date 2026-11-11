import ContactWizard from '@/components/contact/ContactWizard'
import {site} from '@/content/site'

export const metadata = {title: 'Contacto'}

export default function ContactPage() {
  return (
    <main className="px-5 md:px-10 pt-28 pb-10 min-h-[100svh] flex flex-col">
      <p className="meta mb-10">
        HAGAMOS ALGO. — Buenos Aires, Argentina ·{' '}
        <a href={`https://instagram.com/${site.ig}`} className="underline">
          @{site.ig}
        </a>
      </p>
      <ContactWizard />
    </main>
  )
}
