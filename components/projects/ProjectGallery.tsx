import Photo from '@/components/ui/Photo'
import Reveal from '@/components/ui/Reveal'
import type {Img} from '@/content/projects'

/**
 * Agrupa las imágenes (desde la segunda) en filas: dos imágenes 'half'
 * consecutivas van juntas en una grilla de 2 columnas; el resto va sola.
 */
function groupIntoRows(images: Img[]): Img[][] {
  const rows: Img[][] = []
  let i = 1
  while (i < images.length) {
    const current = images[i]
    const next = images[i + 1]
    if (current.size === 'half' && next?.size === 'half') {
      rows.push([current, next])
      i += 2
    } else {
      rows.push([current])
      i += 1
    }
  }
  return rows
}

export default function ProjectGallery({images}: {images: Img[]}) {
  return (
    <div className="mt-12 space-y-2 md:space-y-4 px-2 md:px-4">
      <Photo img={images[0]} priority />
      {groupIntoRows(images).map((row, index) => (
        <Reveal key={index}>
          {row.length === 2 ? (
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <Photo img={row[0]} sizes="50vw" />
              <Photo img={row[1]} sizes="50vw" />
            </div>
          ) : (
            <Photo img={row[0]} />
          )}
        </Reveal>
      ))}
    </div>
  )
}
