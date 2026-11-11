import Link from 'next/link'
import {projects} from '@/content/projects'

export const metadata = {title: 'Trabajos'}

export default function WorkPage() {
  return (
    <main className="px-5 md:px-10 pt-28 pb-16">
      <h1 className="h-xl mb-12">WORK</h1>
      {projects.map((p) => (
        <Link
          key={p.slug}
          href={`/work/${p.slug}`}
          className="group flex justify-between items-baseline gap-4 py-5 border-t border-g2 hover:pl-2 transition-all"
        >
          <span className="meta text-g1">{p.n}</span>
          <span className="font-serif text-4xl md:text-6xl group-hover:italic flex-1">{p.title}</span>
          <span className="meta text-right hidden sm:block">
            {p.type}
            <br />
            {p.date}
          </span>
        </Link>
      ))}
    </main>
  )
}
