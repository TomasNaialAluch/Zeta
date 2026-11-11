'use client'
import {createContext, useCallback, useContext, useEffect, useRef} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {navLinks} from '@/content/navigation'
import {scrollToTop} from '@/lib/scrollToTop'

/**
 * Transición entre páginas con efecto "hoja de revista":
 *  1. Una hoja de papel entra desde la derecha y tapa la página actual.
 *  2. Mientras está tapada, se cambia de ruta.
 *  3. La hoja se da vuelta sobre su lomo (izquierda) y revela la página nueva.
 */

const COVER_MS = 650
const TURN_MS = 950
const MAX_WAIT_MS = 4000 // por si la página nueva tarda en compilar
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

  const busy = useRef(false)
  const pendingHref = useRef<string | null>(null)
  const currentPath = useRef(pathname)
  const revealNow = useRef<(() => void) | null>(null)

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
    leafEl.getAnimations().forEach((a) => a.cancel())
    shadeEl.getAnimations().forEach((a) => a.cancel())
    busy.current = false
    pendingHref.current = null
    revealNow.current = null
  }, [])

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
      window.scrollTo(0, 0)
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
          <span className="font-serif text-ink/10 text-[clamp(6rem,24vw,22rem)] leading-none select-none">
            ZETA
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
