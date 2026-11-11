'use client'
import {useCallback, useEffect, useRef, useState} from 'react'
import {projects} from '@/content/projects'
import {jumpTo} from '@/lib/smoothScroll'

/**
 * Índice de trabajos en forma de rueda (estilo selector de cámara).
 * - Cerrado: media rueda con marcas asomando por el borde izquierdo.
 * - Al acercar el mouse: se despliega; la letra crece según la cercanía del cursor (fisheye)
 *   y suena un "tic" cada vez que cambia el trabajo enfocado.
 * - Click: la rueda hace un pulso y la página se desplaza suavemente hasta el trabajo.
 */

const ROW = 56 // alto de cada fila (px)
const RADIUS = 440 // radio de la rueda (px)
const PAD = 24
const HEIGHT = PAD * 2 + ROW * projects.length
const CENTER_Y = HEIGHT / 2
const MIN_SCALE = 0.4

const targetId = (slug: string) => `work-${slug}`

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function WorkDial() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0) // trabajo visible en pantalla
  const [focus, setFocus] = useState<number | null>(null) // trabajo bajo el cursor
  const [picked, setPicked] = useState<number | null>(null) // trabajo clickeado (animación)

  const wrapRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const mouseY = useRef(CENTER_Y) // objetivo
  const shownY = useRef(CENTER_Y) // valor suavizado
  const focusRef = useRef<number | null>(null)
  const openRef = useRef(false)
  const activeRef = useRef(0)
  const raf = useRef(0)
  const audio = useRef<AudioContext | null>(null)
  const scrolling = useRef(false)
  const ignoreClick = useRef(false) // en táctil el pick ocurre al soltar; evita el doble disparo del click

  /* ---------- sonido "tic" ---------- */
  const tick = useCallback((strong = false) => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      audio.current ??= new AC()
      const ctx = audio.current
      if (ctx.state === 'suspended') ctx.resume()
      if (ctx.state !== 'running') return
      const t = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(strong ? 1500 : 2400, t)
      osc.frequency.exponentialRampToValueAtTime(strong ? 600 : 900, t + 0.03)
      gain.gain.setValueAtTime(strong ? 0.05 : 0.03, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.05)
    } catch {
      /* sin audio, sin problema */
    }
    // Vibración corta en móviles que la soportan (Android); iOS ignora esto.
    try {
      if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(strong ? 14 : 6)
    } catch {
      /* noop */
    }
  }, [])

  /* ---------- visibilidad + trabajo activo según scroll ---------- */
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const section = document.getElementById('work')
      if (!section) return
      const vh = window.innerHeight
      const r = section.getBoundingClientRect()
      setVisible(r.top < vh * 0.55 && r.bottom > vh * 0.45)

      let best = 0
      let bestDist = Infinity
      projects.forEach((p, i) => {
        const el = document.getElementById(targetId(p.slug))
        if (!el) return
        const b = el.getBoundingClientRect()
        const d = Math.abs(b.top + b.height / 2 - vh / 2)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      if (best !== activeRef.current) {
        activeRef.current = best
        setActive(best)
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* ---------- render de la rueda (fisheye + arco), suavizado con rAF ---------- */
  const paint = useCallback(() => {
    const isOpen = openRef.current
    // Si no hay cursor encima, la rueda se centra en el trabajo activo.
    const goal = isOpen ? mouseY.current : PAD + (activeRef.current + 0.5) * ROW
    shownY.current += (goal - shownY.current) * 0.22
    const y = shownY.current

    projects.forEach((_, i) => {
      const el = itemRefs.current[i]
      if (!el) return
      const cy = PAD + (i + 0.5) * ROW
      const d = Math.abs(cy - y) / ROW
      const k = Math.exp(-((d / 1.05) ** 2)) // 1 en el foco, cae hacia los costados
      const scale = MIN_SCALE + (1 - MIN_SCALE) * k
      const dy = cy - CENTER_Y
      const arc = Math.sqrt(Math.max(RADIUS * RADIUS - dy * dy, 0)) - RADIUS // <= 0
      const x = 72 + arc + k * 26 // el enfocado "sale" hacia afuera
      el.style.transform = `translate3d(${x}px, ${cy - ROW / 2}px, 0) scale(${scale})`
      el.style.opacity = String(0.28 + 0.72 * k)
    })

    if (isOpen || Math.abs(goal - y) > 0.3) raf.current = requestAnimationFrame(paint)
    else raf.current = 0
  }, [])

  const startPaint = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(paint)
  }, [paint])

  useEffect(() => {
    startPaint()
    return () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
  }, [startPaint, active])

  const setFocusIndex = (i: number | null) => {
    if (focusRef.current !== i) {
      focusRef.current = i
      setFocus(i)
      if (i !== null) tick()
    }
  }

  const onMove = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    const y = Math.min(Math.max(e.clientY - rect.top, PAD), HEIGHT - PAD)
    mouseY.current = y
    setFocusIndex(Math.min(projects.length - 1, Math.max(0, Math.floor((y - PAD) / ROW))))
    startPaint()
  }

  const onEnter = (e: React.PointerEvent) => {
    if (scrolling.current) return
    const rect = wrapRef.current!.getBoundingClientRect()
    mouseY.current = Math.min(Math.max(e.clientY - rect.top, PAD), HEIGHT - PAD)
    openRef.current = true
    setOpen(true)
    if (e.pointerType === 'touch') {
      // Al tocar el borde ya hay un trabajo enfocado, sin esperar a mover el dedo.
      setFocusIndex(Math.min(projects.length - 1, Math.max(0, Math.floor((mouseY.current - PAD) / ROW))))
    } else tick()
    startPaint()
  }

  /* Táctil: arrastrás el dedo por la rueda y al soltar viaja al trabajo enfocado. */
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch' || !openRef.current) return
    const i = focusRef.current
    if (i === null) return
    ignoreClick.current = true
    setTimeout(() => (ignoreClick.current = false), 500)
    goTo(null, i)
  }

  const onLeave = () => {
    openRef.current = false
    setOpen(false)
    focusRef.current = null
    setFocus(null)
    startPaint()
  }

  /* ---------- click: pulso + scroll animado hasta el trabajo ---------- */
  const goTo = (e: React.MouseEvent | null, i: number) => {
    e?.preventDefault()
    if (e && ignoreClick.current) return
    const el = document.getElementById(targetId(projects[i].slug))
    if (!el) return
    tick(true)
    setPicked(i)
    scrolling.current = true
    onLeave()

    const from = window.scrollY
    const to = Math.max(0, el.getBoundingClientRect().top + from - 72)
    const dist = Math.abs(to - from)
    // Viaje pedido a propósito por el usuario: se anima siempre, incluso con "reducir movimiento".
    const dur = Math.min(1600, 700 + dist * 0.25)
    const t0 = performance.now()
    let lastBucket = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur)
      jumpTo(from + (to - from) * easeInOut(t))
      // tics suaves mientras viaja, como pasando marcas de la rueda
      const bucket = Math.floor(t * 8)
      if (bucket !== lastBucket) {
        lastBucket = bucket
        tick()
      }
      if (t < 1) requestAnimationFrame(step)
      else {
        scrolling.current = false
        tick(true)
        setTimeout(() => setPicked(null), 250)
      }
    }
    requestAnimationFrame(step)
  }

  return (
    <div
      ref={wrapRef}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onLeave}
      onPointerLeave={onLeave}
      aria-label="Índice de trabajos"
      className={`fixed left-0 z-40 text-ink transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        top: '50%',
        height: HEIGHT,
        marginTop: -HEIGHT / 2,
        width: open ? 'min(420px, 100vw)' : 64,
        touchAction: 'none', // el dedo arrastra la rueda, no la página
      }}
    >
      {/* Media rueda cerrada: marcas que asoman por el borde */}
      <svg
        width="64"
        height={HEIGHT}
        viewBox={`0 0 64 ${HEIGHT}`}
        className={`absolute left-0 top-0 transition-[opacity,transform] duration-300 ${
          open ? 'opacity-0 -translate-x-4' : 'opacity-100'
        }`}
        aria-hidden
      >
        <circle cx={-RADIUS + 34} cy={CENTER_Y} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity=".18" />
        {projects.map((_, i) => {
          const cy = PAD + (i + 0.5) * ROW
          const dy = cy - CENTER_Y
          const x = Math.sqrt(RADIUS * RADIUS - dy * dy) - RADIUS + 34
          const on = i === active
          return (
            <line
              key={i}
              x1={x}
              x2={x + (on ? 26 : 12)}
              y1={cy}
              y2={cy}
              stroke="currentColor"
              strokeWidth={on ? 2 : 1}
              strokeOpacity={on ? 1 : 0.5}
              style={{transition: 'all .3s'}}
            />
          )
        })}
      </svg>
      <span
        className={`meta absolute left-9 transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`}
        style={{top: CENTER_Y - 10, fontSize: 10}}
        aria-hidden
      >
        {projects[active].n}
      </span>

      {/* Rueda abierta */}
      <div
        aria-hidden
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        style={{background: 'linear-gradient(to right, rgba(244,241,235,.96) 0%, rgba(244,241,235,.9) 55%, rgba(244,241,235,0) 100%)'}}
      />
      <nav
        className={`absolute inset-0 overflow-hidden transition-[opacity,transform] duration-300 ease-out ${
          open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
        }`}
        style={{maskImage: 'linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)'}}
      >
        {projects.map((p, i) => (
          <a
            key={p.slug}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            href={`#${targetId(p.slug)}`}
            onClick={(e) => goTo(e, i)}
            tabIndex={open ? 0 : -1}
            className={`absolute left-0 top-0 flex items-baseline gap-3 whitespace-nowrap origin-left will-change-transform ${
              picked === i ? 'dial-picked' : ''
            }`}
            style={{height: ROW, transform: `translate3d(0, ${PAD + i * ROW}px, 0) scale(${MIN_SCALE})`}}
          >
            <span className="meta" style={{fontSize: 11}}>
              {p.n}
            </span>
            <span className={`font-serif leading-none ${focus === i || (focus === null && active === i) ? 'italic' : ''}`} style={{fontSize: 44}}>
              {p.title}
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}
