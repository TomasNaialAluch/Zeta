import Photo from '@/components/ui/Photo'

export const metadata = {title: 'Damián Lezcano'}

export default function AboutPage() {
  return (
    <main className="px-5 md:px-10 pt-28 pb-16">
      <h1 className="h-xl">DAMIÁN<br />LEZCANO</h1>
      <div className="grid md:grid-cols-12 gap-8 mt-12">
        <div className="md:col-span-5 font-serif text-2xl space-y-5">
          <p>ZETA nace de cocinar.</p>
          <p>Del producto, de repetir un gesto hasta entenderlo y de la hospitalidad como parte del oficio.</p>
          <p>Cocino cenas privadas, eventos y colaboraciones en Buenos Aires.</p>
          <p>Cambian el menú, el espacio y la cantidad de personas.</p>
          <p>La intención es la misma:</p>
          <p className="italic">cocinar para que algo suceda.</p>
          <p className="meta">PRODUCTO. OFICIO. HOSPITALIDAD.</p>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <Photo
            img={{kind: 'PROCESS IMAGE — CHEF WORKING', ratio: '4/5', size: 'full'}}
            sizes="(min-width:768px) 50vw,100vw"
          />
        </div>
      </div>
    </main>
  )
}
