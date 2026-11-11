'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

/**
 * Intro de la home: un video de 15 s (chef en primera persona, especias, sartén, muñeco y ZETA
 * formándose en el lente). Se ve una sola vez por sesión, siempre se puede saltar y, si el
 * sistema pide "reducir movimiento", no se muestra.
 *
 * El video arranca sin sonido (los navegadores bloquean el audio automático); el botón "Sonido"
 * lo activa. Al terminar o saltar se hace un fundido y se avisa al Hero (evento `zeta:intro-done`)
 * para que recién entonces aparezcan los lomos.
 */

const SESSION_KEY = 'zeta-intro'
const FADE_MS = 700

type Stage = 'check' | 'play' | 'fade' | 'done'

export default function IntroVideo() {
  const [stage, setStage] = useState<Stage>('check')
  const [sound, setSound] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const finish = useCallback(() => {
    setStage(s => (s === 'play' ? 'fade' : s))
  }, [])

  // Decide si la intro corresponde: una vez por sesión y sin "reducir movimiento".
  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (seen || reduce) {
      setStage('done')
      return
    }
    document.documentElement.dataset.intro = 'playing' // el Hero espera el aviso de que terminó
    setStage('play')
    return () => {
      // Si se desmonta antes de terminar (por ejemplo al navegar), no dejar al Hero esperando.
      if (document.documentElement.dataset.intro === 'playing') {
        delete document.documentElement.dataset.intro
        window.dispatchEvent(new Event('zeta:intro-done'))
      }
    }
  }, [])

  // Mientras la intro está en pantalla no se puede hacer scroll; se puede saltar con Escape.
  useEffect(() => {
    if (stage !== 'play' && stage !== 'fade') return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [stage, finish])

  // Fundido final y aviso al Hero.
  useEffect(() => {
    if (stage !== 'fade') return
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1') // una sola vez por sesión
      } catch {}
      delete document.documentElement.dataset.intro
      window.dispatchEvent(new Event('zeta:intro-done'))
      setStage('done')
    }, FADE_MS)
    return () => window.clearTimeout(t)
  }, [stage])

  const toggleSound = () => {
    const el = video.current
    if (!el) return
    const next = !sound
    el.muted = !next
    if (next) el.volume = 0.8
    setSound(next)
  }

  if (stage === 'done') return null

  return (
    <div
      aria-label="Introducción"
      className="fixed inset-0 z-[300] bg-white transition-opacity ease-out"
      style={{opacity: stage === 'fade' ? 0 : 1, transitionDuration: `${FADE_MS}ms`}}
    >
      {stage !== 'check' && (
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/intro/zeta-intro-poster.jpg"
          onEnded={finish}
          className="absolute inset-0 h-full w-full object-contain select-none"
        >
          <source src="/intro/zeta-intro.webm" type="video/webm" />
          <source src="/intro/zeta-intro.mp4" type="video/mp4" />
        </video>
      )}

      <button
        type="button"
        onClick={toggleSound}
        className="absolute left-5 bottom-6 md:left-10 text-[11px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors"
      >
        {sound ? 'Silenciar' : 'Activar sonido'}
      </button>
      <button
        type="button"
        onClick={finish}
        className="absolute right-5 bottom-6 md:right-10 text-[11px] uppercase tracking-[0.2em] text-black/60 hover:text-black transition-colors"
      >
        Saltar →
      </button>
    </div>
  )
}
