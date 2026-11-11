import Link from 'next/link'
import {notFound} from 'next/navigation'
import ProjectMeta from '@/components/projects/ProjectMeta'
import ProjectGallery from '@/components/projects/ProjectGallery'
import {projects, gallery} from '@/content/projects'

type Params = {params: {slug: string}}

export const generateStaticParams = () => projects.map((p) => ({slug: p.slug}))

export const generateMetadata = ({params}: Params) => {
  const project = projects.find((p) => p.slug === params.slug)
  return project
    ? {title: project.title, description: `${project.type} — ${project.place}, ${project.date}`}
    : {}
}

export default function ProjectPage({params}: Params) {
  const index = projects.findIndex((p) => p.slug === params.slug)
  if (index < 0) notFound()

  const project = projects[index]
  const next = projects[(index + 1) % projects.length]
  const images = project.images ?? gallery

  return (
    <main className="pt-28">
      <section className="px-5 md:px-10">
        <ProjectMeta p={project} />
        {project.guests && <p className="meta mt-1">{project.guests}</p>}
        <h1 className="h-xl mt-8">{project.title}</h1>
        <div className="font-serif text-3xl md:text-5xl mt-8 space-y-1">
          {project.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {project.context && <p className="mt-8 max-w-md">{project.context}</p>}
      </section>

      <ProjectGallery images={images} />

      <Link href={`/work/${next.slug}`} className="block px-5 md:px-10 py-24">
        <span className="meta">NEXT PROJECT →</span>
        <span className="h-xl block mt-2">{next.title}</span>
      </Link>
    </main>
  )
}
