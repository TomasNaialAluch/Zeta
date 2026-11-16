import {jumpTo} from '@/lib/smoothScroll'

const DURATION_MS = 1400
const HEADER_OFFSET = 64 // alto del header fijo

// Arranca suave, acelera y frena despacio al llegar (easeInOutCubic).
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Lleva la página a la posición `target` con un scroll lento y suave.
 * Si el usuario scrollea a mano mientras se mueve, se cancela.
 * No respeta `prefers-reduced-motion` a propósito: el efecto es parte del diseño.
 */
function scrollToY(target: number, duration = DURATION_MS) {
  const start = window.scrollY
  if (start === target) return

  let frame = 0
  const startTime = performance.now()
  const cancelEvents = ['wheel', 'touchstart', 'keydown'] as const

  const stop = () => {
    cancelAnimationFrame(frame)
    cancelEvents.forEach((e) => window.removeEventListener(e, stop))
  }
  cancelEvents.forEach((e) => window.addEventListener(e, stop, {passive: true}))

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1)
    jumpTo(start + (target - start) * easeInOutCubic(progress))
    if (progress < 1) frame = requestAnimationFrame(step)
    else stop()
  }
  frame = requestAnimationFrame(step)
}

/** Sube hasta el inicio de la página. */
export function scrollToTop(duration = DURATION_MS) {
  scrollToY(0, duration)
}

/** Posición de un elemento de la página (por id), descontando el header fijo. */
export function sectionTop(id: string): number | null {
  const element = document.getElementById(id)
  return element ? element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET : null
}

/** Baja (o sube) suavemente hasta la sección con ese id. */
export function scrollToSection(id: string, duration = DURATION_MS) {
  const top = sectionTop(id)
  if (top !== null) scrollToY(top, duration)
}
