import Hero from '@/components/home/Hero'
import SelectedWork from '@/components/home/SelectedWork'
import Services from '@/components/home/Services'
import ContactCta from '@/components/home/ContactCta'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <SelectedWork />
      <Services />
      <ContactCta />
    </main>
  )
}
