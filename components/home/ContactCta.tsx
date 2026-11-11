import Link from 'next/link'

export default function ContactCta() {
  return (
    <section className="bg-ink text-paper px-5 md:px-10 py-24">
      <Link href="/contact" className="block">
        <span className="h-xl block">HAGAMOS<br />ALGO.</span>
        <span className="meta mt-8 block">ENVIAR CONSULTA →</span>
      </Link>
    </section>
  )
}
