import Image from 'next/image'
import type {Img} from '@/content/projects'

type PhotoProps = {
  img: Img
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
}

/** Muestra la imagen, o un placeholder con su descripción si todavía no hay `src`. */
export default function Photo({img, fill, sizes = '100vw', priority, className = ''}: PhotoProps) {
  return (
    <div
      className={`relative overflow-hidden bg-g2 ${fill ? 'absolute inset-0' : 'w-full'} ${className}`}
      style={fill ? undefined : {aspectRatio: img.ratio}}
    >
      {img.src ? (
        <Image src={img.src} alt={img.kind} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="meta text-g1 absolute inset-0 grid place-items-center">{img.kind}</span>
      )}
    </div>
  )
}
