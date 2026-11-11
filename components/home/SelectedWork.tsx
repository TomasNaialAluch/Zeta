import Link from 'next/link'
import ProjectEntry from '@/components/projects/ProjectEntry'
import {projects} from '@/content/projects'

export default function SelectedWork() {
  return (
    <section id="work">
      <div className="px-5 md:px-10 pt-16 meta flex justify-between">
        <span>SELECTED WORK</span>
        <span>({projects.length})</span>
      </div>
      {projects.map((project, index) => (
        <ProjectEntry key={project.slug} p={project} i={index} />
      ))}
      <div className="px-5 md:px-10 pb-16">
        <Link href="/work" className="meta underline underline-offset-4">
          VIEW ALL WORK →
        </Link>
      </div>
    </section>
  )
}
