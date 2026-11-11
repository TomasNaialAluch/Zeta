import ContactForm from '@/components/contact/ContactForm'
import {site} from '@/content/site'

export const metadata = {title: 'Contacto'}

export default function ContactPage() {
  return (
    <main className="px-5 md:px-10 pt-28 pb-16">
      <h1 className="h-xl">HAGAMOS<br />ALGO.</h1>
      <p className="meta mt-6">
        Buenos Aires — Argentina ·{' '}
        <a href={`https://instagram.com/${site.ig}`} className="underline">
          @{site.ig}
        </a>
      </p>
      <ContactForm />
    </main>
  )
}
