'use client'
import {createContext, useCallback, useContext, useEffect, useRef} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {navLinks} from '@/content/navigation'
import {scrollToTop} from '@/lib/scrollToTop'
import {jumpTo} from '@/lib/smoothScroll'

/**
 * Transición entre páginas con efecto "hoja de revista":
 *  1. Una hoja de papel entra desde la derecha y tapa la página actual; sobre la hoja corre el
 *     video del spinner (ZETA con especias), un mínimo de MIN_SHOW_MS para que se aprecie.
 *  2. Mientras está tapada, se cambia de ruta.
 *  3. La hoja se da vuelta sobre su lomo (izquierda) y revela la página nueva.
 */

const COVER_MS = 650
const TURN_MS = 950
const MAX_WAIT_MS = 4000 // por si la página nueva tarda en compilar
// El video del spinner (ZETA con especias) se ve mientras la hoja tapa la página.
// MIN_SHOW_MS = lo mínimo que se muestra, aunque la página nueva cargue al instante, para apreciarlo.
// Hay varias animaciones; en cada cambio de página se usa una al azar (nunca la misma dos veces seguidas).
// Se baja solo la próxima en segundo plano (~9 MB cada una), no todas juntas.
const SPINNERS = [1, 2, 3, 4].map((n) => `/animaciones/zeta-spinner-${n}.mp4`)
const MIN_SHOW_MS = 4000
const SPINNER_RATE = 1.6 // el video dura 7,2 s; a 1,6x se ve casi entero en el mínimo
const EASE_COVER = 'cubic-bezier(.77,0,.18,1)'
const EASE_TURN = 'cubic-bezier(.65,0,.25,1)'

// Orden de las páginas, como en un índice de revista: Inicio, Trabajos, Sobre mí, Contacto.
const PAGE_ORDER = ['/', ...navLinks.map((link) => link.href)]

/** Posición de una ruta en la "revista". Un proyecto cuenta justo después de /work. */
function pageRank(path: string): number {
  const section = PAGE_ORDER.findIndex((p) => (p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`)))
  const isDetail = path !== PAGE_ORDER[section] && section > 0
  return section + (isDetail ? 0.5 : 0)
}

type Navigate = (href: string) => void
const TransitionContext = createContext<Navigate | null>(null)

export function usePageTransition(): Navigate {
  const navigate = useContext(TransitionContext)
  if (!navigate) throw new Error('usePageTransition debe usarse dentro de <PageTransition>')
  return navigate
}

export default function PageTransition({children}: {children: React.ReactNode}) {
  const router = useRouter()
  const pathname = usePathname()
  const stage = useRef<HTMLDivElement>(null)
  const leaf = useRef<HTMLDivElement>(null)
  const shade = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const spinnerIdx = useRef(-1) // cuál se mostró/precargó última vez

  const busy = useRef(false)
  const pendingHref = useRef<string | null>(null)
  const currentPath = useRef(pathname)
  const revealNow = useRef<(() => void) | null>(null)

  // Elige una animación al azar distinta de la anterior y la baja en segundo plano, sin frenar la página.
  const preloadNext = useCallback(() => {
    const el = video.current
    if (!el) return
    let next = Math.floor(Math.random() * SPINNERS.length)
    if (next === spinnerIdx.current) next = (next + 1) % SPINNERS.length
    spinnerIdx.current = next
    const load = () => {
      el.src = SPINNERS[next]
      el.load()
    }
    // Safari no tiene requestIdleCallback: ahí se usa un timeout.
    const w = window as Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number}
    if (w.requestIdleCallback) w.requestIdleCallback(load, {timeout: 4000})
    else setTimeout(load, 1500)
  }, [])

  useEffect(() => {
    preloadNext()
  }, [preloadNext])

  // Cuando la ruta cambió de verdad, se puede abrir la hoja.
  useEffect(() => {
    currentPath.current = pathname
    if (pendingHref.current === pathname) revealNow.current?.()
  }, [pathname])

  // direction: 1 = avanzar en la revista (hoja de derecha a izquierda), -1 = retroceder.
  const turnPage = useCallback(async (direction: 1 | -1) => {
    const leafEl = leaf.current!
    const shadeEl = shade.current!
    // Avanzando el lomo está a la izquierda; retrocediendo, a la derecha.
    leafEl.style.transformOrigin = direction === 1 ? 'left center' : 'right center'
    shadeEl.style.opacity = '0'
    const turn = leafEl.animate(
      [{transform: 'rotateY(0deg)'}, {transform: `rotateY(${-105 * direction}deg)`}],
      {duration: TURN_MS, easing: EASE_TURN, fill: 'forwards'},
    )
    shadeEl.animate([{opacity: 0}, {opacity: 1}], {duration: TURN_MS, easing: 'ease-in', fill: 'forwards'})
    await turn.finished
    stage.current!.style.visibility = 'hidden'
    video.current?.pause()
    preloadNext() // la próxima transición usa otra animación
    leafEl.getAnimations().forEach((a) => a.cancel())
    shadeEl.getAnimations().forEach((a) => a.cancel())
    busy.current = false
    pendingHref.current = null
    revealNow.current = null
  }, [preloadNext])

  const navigate = useCallback(
    async (href: string) => {
      if (busy.current) return
      if (href === currentPath.current) {
        scrollToTop()
        return
      }
      busy.current = true
      pendingHref.current = href

      const direction = pageRank(href) >= pageRank(currentPath.current) ? 1 : -1
      const stageEl = stage.current!
      const leafEl = leaf.current!
      const shadeEl = shade.current!
      stageEl.style.visibility = 'visible'
      stageEl.style.pointerEvents = 'auto'
      // El video arranca desde el principio junto con la hoja.
      const videoEl = video.current
      const shownAt = performance.now()
      if (videoEl) {
        videoEl.currentTime = 0
        videoEl.playbackRate = SPINNER_RATE
        videoEl.play().catch(() => {})
      }
      leafEl.style.transformOrigin = 'center'
      // La sombra y el degradé del pliegue se espejan según el lado del lomo.
      leafEl.style.boxShadow = `${-40 * direction}px 0 80px rgba(0,0,0,.28)`
      shadeEl.style.background = `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, rgba(0,0,0,0) 30%, rgba(0,0,0,.4))`

      // 1) La hoja entra (desde la derecha si avanzás, desde la izquierda si retrocedés).
      await leafEl.animate(
        [{transform: `translateX(${100 * direction}%)`}, {transform: 'translateX(0)'}],
        {duration: COVER_MS, easing: EASE_COVER, fill: 'forwards'},
      ).finished

      // 2) Con todo tapado, se cambia de ruta y se espera a que cargue.
      const loaded = new Promise<void>((resolve) => {
        revealNow.current = resolve
        setTimeout(resolve, MAX_WAIT_MS)
      })
      router.push(href)
      await loaded
      // Tiempo mínimo para que se aprecie el video, aunque la página ya esté lista.
      const remaining = MIN_SHOW_MS - (performance.now() - shownAt)
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
      jumpTo(0)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      // 3) La hoja se da vuelta y revela la página nueva.
      stageEl.style.pointerEvents = 'none'
      await turnPage(direction)
    },
    [router, turnPage],
  )

  return (
    <TransitionContext.Provider value={navigate}>
      {children}
      {/* Escenario 3D: la hoja vive acá, por encima de todo (incluido el header). */}
      <div
        ref={stage}
        aria-hidden
        className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
        style={{perspective: '1800px', visibility: 'hidden'}}
      >
        <div
          ref={leaf}
          className="absolute inset-0 bg-paper grid place-items-center"
          style={{
            transform: 'translateX(100%)',
            backfaceVisibility: 'hidden',
            boxShadow: '-40px 0 80px rgba(0,0,0,.28)',
          }}
        >
          <video
            ref={video}
            muted
            playsInline
            loop
            preload="none"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
          />
          {/* Sombra de pliegue que se oscurece mientras la hoja se levanta. */}
          <div
            ref={shade}
            className="absolute inset-0"
            style={{background: 'linear-gradient(to right, rgba(0,0,0,0) 30%, rgba(0,0,0,.4))', opacity: 0}}
          />
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
