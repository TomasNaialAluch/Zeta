'use client'
import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {gsap} from 'gsap'
import {Flip} from 'gsap/Flip'
import Reveal from '@/components/ui/Reveal'
import ExperienceVideo from '@/components/home/ExperienceVideo'
import {experienceVideos} from '@/content/experience'
import {scrollToSection} from '@/lib/scrollToTop'

gsap.registerPlugin(Flip)

// useLayoutEffect en el navegador (para animar antes de pintar); useEffect en el servidor, que no lo soporta.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const RESIZE_S = 1 // duración de agrandar / achicar
const RESIZE_EASE = 'power3.inOut'

/**
 * Videos de un día de evento, para que el cliente vea cómo es la experiencia.
 * Compactos hasta que se les da play: el que suena se agranda (y el otro baja debajo);
 * al pausar vuelve al tamaño chico. Se reproduce uno a la vez.
 * El cambio de tamaño/posición se anima (Flip) para que no pegue saltos.
 */
export default function Experience() {
  const [active, setActive] = useState<number | null>(null) // cuál tiene el <video> cargado
  const [expanded, setExpanded] = useState(false) // true mientras ese video está sonando
  const grid = useRef<HTMLDivElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)

  /** Guarda cómo se ven las tarjetas ahora; después del próximo render se anima hasta su nuevo lugar. */
  const captureLayout = () => {
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll('[data-card]'))
  }

  const setExpandedAnimated = (next: boolean) => {
    if (next === expanded) return
    captureLayout()
    setExpanded(next)
  }

  useIsoLayoutEffect(() => {
    const state = flipState.current
    if (!state) return
    flipState.current = null
    const tween = Flip.from(state, {duration: RESIZE_S, ease: RESIZE_EASE, scale: false, overwrite: true})
    return () => {
      tween.kill()
    }
  }, [expanded, active])

  // Al agrandarse, la sección se acomoda (a la par de la animación) para que el video quede a la vista.
  useEffect(() => {
    if (expanded) scrollToSection('experience', RESIZE_S * 1000)
  }, [expanded])

  return (
    <section id="experience" className="px-5 md:px-10 py-10 md:py-16 border-t border-g2">
      <div className="meta flex justify-between mb-5 md:mb-8">
        <span>THE EXPERIENCE</span>
        <span>({experienceVideos.length})</span>
      </div>
      <div
        ref={grid}
        className={
          expanded
            ? 'grid grid-cols-1 gap-6 md:gap-10'
            : 'grid grid-cols-2 gap-3 md:gap-10 md:grid-cols-[repeat(2,20rem)]'
        }
      >
        {experienceVideos.map((video, index) => {
          const isOpen = expanded && active === index
          const size = expanded ? (isOpen ? 'order-first w-full max-w-sm md:max-w-md' : 'w-[calc(50%-0.375rem)] md:w-80') : ''
          return (
            <div key={video.src} data-card className={size}>
              <Reveal>
                <ExperienceVideo
                  video={video}
                  index={index}
                  playing={active === index}
                  onSelect={() => {
                    captureLayout()
                    setExpanded(false)
                    setActive(index)
                  }}
                  onVideoPlay={() => setExpandedAnimated(true)}
                  onVideoPause={() => setExpandedAnimated(false)}
                />
              </Reveal>
            </div>
          )
        })}
      </div>
    </section>
  )
}
