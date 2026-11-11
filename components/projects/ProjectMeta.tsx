import type {Project} from '@/content/projects'

export default function ProjectMeta({p}: {p: Project}) {
  return (
    <div className="meta">
      <div>PROJECT {p.n}</div>
      <div>{p.type}</div>
      <div>{p.date}</div>
      <div>{p.place}</div>
    </div>
  )
}
