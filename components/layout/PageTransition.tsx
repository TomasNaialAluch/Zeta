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
// 1-4: hechas en After Effects. ia-*: generadas con Adobe Firefly (Veo 3.1) con la tipografía de ZETA.
// Se baja solo la próxima en segundo plano (1,4 a 9 MB cada una), no todas juntas.
const SPINNERS = [
  ...[1, 2, 3, 4].map((n) => `/animaciones/zeta-spinner-${n}.mp4`),
  '/animaciones/zeta-ia-1-granos.mp4',
  '/animaciones/zeta-ia-2-remolino.mp4',
  '/animaciones/zeta-ia-3-polvo.mp4',
  '/animaciones/zeta-ia-4-sal.mp4',
  '/animaciones/zeta-ia-5-azucar.mp4',
]
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
  const hint = useRef<HTMLSpanElement>(null)
  const shownAt = useRef(0)
  const skipRequested = useRef(false) // el usuario pidió saltar la espera mínima
  const skipNow = useRef<(() => void) | null>(null)

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

  // Clic, toque o Escape/Enter/Espacio sobre la pantalla de carga: acorta la espera mínima.
  // Se ignora mientras la hoja todavía está entrando, para no saltear con el mismo clic que navegó.
  const requestSkip = useCallback(() => {
    if (!busy.current || performance.now() - shownAt.current < COVER_MS) return
    skipRequested.current = true
    skipNow.current?.()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') requestSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestSkip])

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
      shownAt.current = performance.now()
      skipRequested.current = false
      skipNow.current = null
      if (hint.current) {
        hint.current.getAnimations().forEach((a) => a.cancel())
        hint.current.style.opacity = '0'
        hint.current.animate([{opacity: 0}, {opacity: 1}], {delay: 1100, duration: 600, fill: 'forwards'})
      }
      if (videoEl) {
        videoEl.currentTime = 0
        videoEl.playbackRate = SPINNER_RATE
        // Algunas animaciones (remolino y polvo) traen sonido. Si el navegador no deja sonar, va sin audio.
        videoEl.muted = false
        videoEl.volume = 0.7
        videoEl.play().catch(() => {
          videoEl.muted = true
          videoEl.play().catch(() => {})
        })
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
      const remaining = MIN_SHOW_MS - (performance.now() - shownAt.current)
      if (remaining > 0 && !skipRequested.current) {
        await new Promise<void>((resolve) => {
          skipNow.current = resolve
          setTimeout(resolve, remaining)
        })
      }
      skipNow.current = null
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
        onPointerDown={requestSkip}
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
            playsInline
            loop
            preload="none"
            tabIndex={-1}
            className="absolute left-0 top-1/2 w-full -translate-y-1/2 aspect-video object-cover pointer-events-none select-none [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] landscape:inset-0 landscape:top-0 landscape:h-full landscape:translate-y-0 landscape:aspect-auto landscape:[mask-image:none] landscape:[-webkit-mask-image:none]"
          />
          <span
            ref={hint}
            className="absolute bottom-8 left-0 right-0 text-center text-[11px] uppercase tracking-[0.2em] text-ink/40 select-none"
            style={{opacity: 0}}
          >
            Clic o tocá para continuar
          </span>
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
