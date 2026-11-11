import Link from 'next/link'
import Photo from '@/components/ui/Photo'
import ProjectMeta from '@/components/projects/ProjectMeta'
import Reveal from '@/components/ui/Reveal'
import {gallery, type Project} from '@/content/projects'

export default function ProjectEntry({p, i}: {p: Project; i: number}) {
  const images = p.images ?? gallery
  const isOdd = i % 2 === 1
  const isPair = p.layout === 'pair'

  // Layout asimétrico: alterna el lado en el que se apoya la imagen.
  const position = p.layout === 'asym' ? (isOdd ? 'md:w-7/12 md:ml-auto' : 'md:w-8/12') : ''
  const align = isOdd ? 'md:text-right' : ''

  return (
    <Reveal className="px-5 md:px-10 py-14 md:py-24">
      <Link href={`/work/${p.slug}`} className="group block">
        <div className="flex justify-between items-start mb-4">
          <ProjectMeta p={p} />
          <span className="meta hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
            VIEW →
          </span>
        </div>

        <div
          className={`${position} ${isPair ? 'grid grid-cols-2 gap-2 md:gap-4' : ''} transition-opacity duration-500 group-hover:opacity-80`}
        >
          {isPair ? (
            <>
              <Photo img={images[1]} sizes="50vw" />
              <Photo img={images[2]} sizes="50vw" />
            </>
          ) : (
            <Photo img={images[0]} sizes="(min-width:768px) 70vw,100vw" />
          )}
        </div>

        <h3 className={`h-xl mt-5 ${align} group-hover:italic`}>{p.title}</h3>
        {p.lines[0] && (
          <p className={`meta text-g1 mt-2 ${align}`}>
            {p.guests ? `${p.guests} — ` : ''}
            {p.lines[0]}
          </p>
        )}
      </Link>
    </Reveal>
  )
}
