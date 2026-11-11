import SpiceCollage from '@/components/home/SpiceCollage'

export default function Hero() {
  return (
    <section className="relative h-[100svh] bg-ink text-paper flex flex-col justify-end px-5 md:px-10 pb-8">
      <SpiceCollage />
      <h1 className="relative">
        <span className="h-xl block">ZETA</span>
        <span className="relative font-serif text-[clamp(2.2rem,8vw,6rem)] leading-[.95] block mt-4">
          PRODUCTO.<br />OFICIO.<br />HOSPITALIDAD.
        </span>
      </h1>
      <p className="relative font-serif italic text-2xl mt-6">Cocinamos para que algo suceda.</p>
      <div className="relative meta mt-4 flex flex-col md:flex-row md:justify-between gap-1">
        <span>Buenos Aires — Argentina</span>
        <span>PRIVATE DINING / EVENTS / POP UPS / COLLABORATIONS</span>
      </div>
    </section>
  )
}
