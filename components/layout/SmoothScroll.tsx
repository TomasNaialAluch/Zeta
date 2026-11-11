'use client'
import {useEffect} from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import {gsap} from 'gsap'
import {setLenis} from '@/lib/smoothScroll'

/**
 * Scroll suave (Lenis), movido por el ticker de GSAP.
 * - Solo suaviza rueda/trackpad; en táctil se mantiene el scroll nativo.
 * - Con `prefers-reduced-motion` no se activa.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9})
    setLenis(lenis)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return null
}
