'use client'

import {useEffect, useRef, useState} from 'react'

/** Orden de arcoíris: rojos → rosa → naranjas → amarillos → verdes → marrones y negros. */
const SPICES = [
  'aji-rojo-fresco',
  'aji-rojo-abundancia',
  'aji-seco-rojo',
  'aji-seco-pila',
  'morron-rojo',
  'paprika-polvo',
  'pimienta-rosa',
  'morron-amarillo-naranja',
  'azafran-hebras',
  'curcuma-polvo',
  'morron-amarillo-apilado',
  'oregano-hojas',
  'morron-verde',
  'pimientas-roja-blanca-negra',
  'pimientas-mixtas',
  'canela-en-rama',
  'anis-estrella',
  'pimienta-negra-granos',
]

/** Alturas fijas (en %) para que parezcan lomos de libros de distinto tamaño. */
const HEIGHTS = [82, 96, 74, 100, 88, 92, 70, 98, 84, 94, 76, 100, 86, 72, 96, 80, 90, 78]

const IDLE_MS = 1800 // sin mover el mouse, el brillo se pasea solo cada tanto

/**
 * Fondo del Hero: negro al principio. Al apoyar el mouse (o tocar) aparecen lomos de
 * especias como en una estantería, inclinados, y se quedan. El brillo de cristal
 * sigue al mouse; si el mouse está quieto, se pasea solo por los lomos al azar.
 */
export default function SpiceCollage() {
  const root = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [lit, setLit] = useState<number | null>(null)
  const lastMove = useRef(0)

  // El collage escucha al <section> que lo contiene, porque el texto del Hero queda por encima.
  useEffect(() => {
    const host = root.current?.parentElement
    if (!host) return

    const onMove = (e: PointerEvent) => {
      setRevealed(true)
      lastMove.current = Date.now()
      const spine = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find(el => (el as HTMLElement).dataset?.spine !== undefined) as HTMLElement | undefined
      setLit(spine ? Number(spine.dataset.spine) : null)
    }
    const onLeave = () => setLit(null)

    host.addEventListener('pointerenter', onMove)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      host.removeEventListener('pointerenter', onMove)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // Brillo aleatorio de a uno cuando el mouse está quieto.
  useEffect(() => {
    if (!revealed) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = window.setInterval(() => {
      if (Date.now() - lastMove.current < IDLE_MS) return
      setLit(prev => {
        let next = Math.floor(Math.random() * SPICES.length)
        if (next === prev) next = (next + 1) % SPICES.length
        return next
      })
    }, 1400)
    return () => window.clearInterval(id)
  }, [revealed])

  return (
    <div ref={root} aria-hidden className="spice-shelf absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`spice-tilt ${revealed ? 'is-on' : ''}`}>
        {SPICES.map((name, i) => (
          <div
            key={name}
            data-spine={i}
            className={`spice-spine ${lit === i ? 'is-lit' : ''} ${lit !== null && lit !== i ? 'is-dim' : ''}`}
            style={{height: `${HEIGHTS[i]}%`, transitionDelay: revealed ? `${i * 45}ms` : '0ms'}}
          >
            {revealed && (
              // Tiras ya recortadas y comprimidas (public/especias/lomos): livianas, sin pasar por el optimizador.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/especias/lomos/${name}.webp`}
                alt=""
                decoding="async"
                draggable={false}
                className="spice-img absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="spice-sheen" />
          </div>
        ))}
      </div>
      {/* oscurece abajo/izquierda para que el texto del Hero se siga leyendo */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
    </div>
  )
}
