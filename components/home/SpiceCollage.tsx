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

const START_MS = 600 // negro puro antes de empezar
const STAGGER_MS = 130 // retraso entre lomo y lomo
const ENTRY_MS = SPICES.length * STAGGER_MS + 1200
// Color representativo de cada lomo (mismo orden que SPICES), ajustado para leerse sobre fondo oscuro.
const SPINE_COLORS = ['hsl(9 61% 61%)','hsl(358 82% 58%)','hsl(2 59% 69%)','hsl(10 69% 58%)','hsl(3 72% 58%)','hsl(12 82% 58%)','hsl(359 58% 58%)','hsl(39 81% 60%)','hsl(22 72% 58%)','hsl(32 90% 58%)','hsl(43 90% 63%)','hsl(96 55% 58%)','hsl(76 79% 58%)','hsl(19 68% 58%)','hsl(32 55% 58%)','hsl(28 55% 58%)','hsl(32 55% 58%)','hsl(25 55% 58%)']
const BLINK_MS = 900 // parpadeo en negro del lomo tocado
const FLIGHT_MS = 750 // viaje del color hasta el texto

const IDLE_MS = 1800 // sin mover el mouse, el brillo se pasea solo cada tanto

/**
 * Fondo del Hero: negro al principio. Al apoyar el mouse (o tocar) aparecen lomos de
 * especias como en una estantería, inclinados, y se quedan. El brillo de cristal
 * sigue al mouse; si el mouse está quieto, se pasea solo por los lomos al azar.
 */
export default function SpiceCollage() {
  const root = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [entered, setEntered] = useState(false) // terminó la entrada escalonada
  const [lit, setLit] = useState<number | null>(null)
  const [blink, setBlink] = useState<number | null>(null)
  const lastMove = useRef(0)
  const nextLine = useRef(0) // a cuál de los 4 textos le toca el próximo color

  // Entrada: negro al cargar y, enseguida, los lomos aparecen de izquierda a derecha y quedan.
  useEffect(() => {
    // Con "reducir movimiento" la entrada sigue, pero solo como fundido (ver globals.css).
    const t1 = window.setTimeout(() => {
      lastMove.current = Date.now() + ENTRY_MS // el brillo solitario espera a que termine la entrada
      setRevealed(true)
    }, START_MS)
    const t2 = window.setTimeout(() => setEntered(true), START_MS + ENTRY_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  // El collage escucha al <section> que lo contiene, porque el texto del Hero queda por encima.
  useEffect(() => {
    const host = root.current?.parentElement
    if (!host) return

    const onMove = (e: PointerEvent) => {
      lastMove.current = Date.now()
      const spine = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find(el => (el as HTMLElement).dataset?.spine !== undefined) as HTMLElement | undefined
      setLit(spine ? Number(spine.dataset.spine) : null)
    }
    const onLeave = () => setLit(null)

    // Clic/toque en un lomo: parpadea en negro y su color viaja al siguiente texto del Hero.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a,button')) return
      const spine = document
        .elementsFromPoint(e.clientX, e.clientY)
        .find(el => (el as HTMLElement).dataset?.spine !== undefined) as HTMLElement | undefined
      if (!spine) return
      const i = Number(spine.dataset.spine)
      lastMove.current = Date.now()

      setBlink(null)
      requestAnimationFrame(() => setBlink(i))
      window.setTimeout(() => setBlink(prev => (prev === i ? null : prev)), BLINK_MS)

      const lines = Array.from(host.querySelectorAll<HTMLElement>('[data-hero-line]'))
      if (!lines.length) return
      const target = lines[nextLine.current % lines.length]
      nextLine.current += 1
      const color = SPINE_COLORS[i]
      const paint = () => {
        target.style.transition = 'color .6s ease'
        target.style.color = color
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return paint()

      // Una bolita del color del lomo vuela desde el toque hasta el texto y lo tiñe al llegar.
      const box = target.getBoundingClientRect()
      const orb = document.createElement('div')
      orb.setAttribute('aria-hidden', 'true')
      orb.style.cssText = `position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;pointer-events:none;z-index:50;background:${color};box-shadow:0 0 28px 6px ${color}`
      document.body.appendChild(orb)
      const tx = Math.min(box.left + box.width / 2, window.innerWidth - 20)
      const ty = box.top + box.height / 2
      const mx = (e.clientX + tx) / 2
      const my = Math.min(e.clientY, ty) - 90 // pasa por arriba, en arco
      const anim = orb.animate(
        [
          {transform: `translate(${e.clientX}px,${e.clientY}px) scale(.6)`, opacity: 0.2, offset: 0},
          {transform: `translate(${e.clientX}px,${e.clientY}px) scale(1.1)`, opacity: 1, offset: 0.12},
          {transform: `translate(${mx}px,${my}px) scale(1)`, opacity: 1, offset: 0.55},
          {transform: `translate(${tx}px,${ty}px) scale(.7)`, opacity: 0.9, offset: 1},
        ],
        {duration: FLIGHT_MS, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards'},
      )
      anim.onfinish = () => {
        orb.remove()
        paint()
      }
    }

    host.addEventListener('pointerenter', onMove)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerdown', onMove)
    host.addEventListener('pointerleave', onLeave)
    host.addEventListener('click', onClick)
    return () => {
      host.removeEventListener('pointerenter', onMove)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onMove)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('click', onClick)
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
            className={`spice-spine ${lit === i ? 'is-lit' : ''} ${lit !== null && lit !== i ? 'is-dim' : ''} ${blink === i ? 'is-blink' : ''}`}
            style={{height: `${HEIGHTS[i]}%`, transitionDelay: revealed && !entered ? `${i * STAGGER_MS}ms` : '0ms'}}
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
