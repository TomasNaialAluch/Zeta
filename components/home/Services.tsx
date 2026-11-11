import Reveal from '@/components/ui/Reveal'
import {services} from '@/content/services'

export default function Services() {
  return (
    <section className="px-5 md:px-10 py-16 border-t border-g2">
      <p className="meta mb-8">SERVICES</p>
      {services.map(([name, description]) => (
        <Reveal key={name} className="grid md:grid-cols-12 gap-2 py-6 border-t border-g2">
          <h2 className="meta md:col-span-4">{name}</h2>
          <p className="font-serif text-2xl md:col-span-7">{description}</p>
        </Reveal>
      ))}
    </section>
  )
}
