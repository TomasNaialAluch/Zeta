import {jumpTo} from '@/lib/smoothScroll'

const DURATION_MS = 1400

// Arranca suave, acelera y frena despacio al llegar (easeInOutCubic).
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Sube hasta el inicio de la página con un scroll lento y suave.
 * Si el usuario scrollea a mano mientras sube, se cancela.
 * No respeta `prefers-reduced-motion` a propósito: el efecto es parte del diseño.
 */
export function scrollToTop(duration = DURATION_MS) {
  const start = window.scrollY
  if (start === 0) return

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
    jumpTo(start * (1 - easeInOutCubic(progress)))
    if (progress < 1) frame = requestAnimationFrame(step)
    else stop()
  }
  frame = requestAnimationFrame(step)
}
