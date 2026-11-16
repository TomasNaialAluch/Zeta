import Image from 'next/image'
import type {ExperienceVideo as Video} from '@/content/experience'

type Props = {
  video: Video
  index: number
  /** true cuando este video ya está cargado (si no, se ve la miniatura). */
  playing: boolean
  onSelect: () => void
  onVideoPlay: () => void
  onVideoPause: () => void
}

/**
 * Tarjeta de video. Muestra la miniatura y no descarga el video hasta que se toca:
 * recién ahí se crea el <video> y arranca solo. Así la página no carga MB que quizá nadie mire.
 */
export default function ExperienceVideo({video, index, playing, onSelect, onVideoPlay, onVideoPause}: Props) {
  return (
    <div>
      <div className="relative aspect-[9/16] bg-ink overflow-hidden">
        {playing ? (
          <video
            className="absolute inset-0 w-full h-full object-contain"
            src={video.src}
            poster={video.poster}
            controls
            autoPlay
            playsInline
            onPlay={onVideoPlay}
            onPause={onVideoPause}
            aria-label={video.title}
          />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            aria-label={`Ver video: ${video.title}`}
            className="group absolute inset-0 w-full h-full text-paper text-left"
          >
            <Image
              src={video.poster}
              alt=""
              fill
              sizes="(min-width: 768px) 20rem, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-ink/25 group-hover:bg-ink/10 transition-colors" />
            <span className="absolute top-4 left-4 meta">{String(index + 1).padStart(3, '0')}</span>
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid place-items-center w-12 h-12 md:w-16 md:h-16 rounded-full border border-paper/80 bg-ink/30 backdrop-blur-sm text-xl pl-1">
                ▶
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex justify-between gap-4 pt-3 meta">
        <span>{video.title}</span>
        <span>{video.type}</span>
      </div>
      <p className="font-serif text-xl md:text-2xl pt-2">{video.note}</p>
    </div>
  )
}
