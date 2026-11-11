'use client'
import {useEffect, useRef} from 'react'

/**
 * Mesa interactiva: cada persona que sumás aparece sentada.
 * Arranca en una mesa redonda, se estira hasta una mesa larga de quincho y,
 * con más gente, se suman filas de mesas (la escena se aleja para que entre completa).
 *
 * Por ahora comensales y mesas son formas simples (placeholder): cuando estén los SVG
 * de Illustrator se reemplazan `Diner` y las mesas, sin tocar la lógica de distribución.
 */

const W = 1000
const H = 440
const GAP = 44 // distancia entre comensales
const MAX_SHAPES = 400 // por encima de esto, cada figura representa varias personas
const MAX_PER_TABLE = 40
const ROW = 190

type Table = {x: number; y: number; w: number; h: number; rx: number}
type Seat = {x: number; y: number}
type Scene = {tables: Table[]; seats: Seat[]}

/** Mesa redonda que se estira (estadio) y reparte los lugares por el perímetro. */
function stadium(n: number): Scene {
  const r = 50
  const R = r + 30
  const L = Math.max(0, (Math.max(n, 8) * GAP - 2 * Math.PI * R) / 2)
  const P = 2 * L + 2 * Math.PI * R
  const seats: Seat[] = []
  for (let i = 0; i < n; i++) {
    const s = ((i + 0.5) * P) / n
    const arc = Math.PI * R
    let x: number, y: number
    if (s < arc) {
      const a = -Math.PI / 2 + s / R
      ;[x, y] = [L / 2 + R * Math.cos(a), R * Math.sin(a)]
    } else if (s < arc + L) {
      ;[x, y] = [L / 2 - (s - arc), R]
    } else if (s < 2 * arc + L) {
      const a = Math.PI / 2 + (s - arc - L) / R
      ;[x, y] = [-L / 2 + R * Math.cos(a), R * Math.sin(a)]
    } else {
      ;[x, y] = [-L / 2 + (s - 2 * arc - L), -R]
    }
    seats.push({x, y})
  }
  return {tables: [{x: -(L + 2 * r) / 2, y: -r, w: L + 2 * r, h: 2 * r, rx: r}], seats}
}

/** Mesas rectangulares de quincho: comensales a ambos lados; varias filas si hace falta. */
function rows(n: number): Scene {
  const count = Math.ceil(n / MAX_PER_TABLE)
  const base = Math.floor(n / count)
  const extra = n % count
  const tables: Table[] = []
  const seats: Seat[] = []
  for (let k = 0; k < count; k++) {
    const c = base + (k < extra ? 1 : 0)
    const perSide = Math.ceil(c / 2)
    const w = perSide * GAP + 16
    const cy = (k - (count - 1) / 2) * ROW
    tables.push({x: -w / 2, y: cy - 28, w, h: 56, rx: 8})
    for (let j = 0; j < c; j++) {
      const top = j % 2 === 0
      seats.push({x: -w / 2 + 8 + GAP / 2 + Math.floor(j / 2) * GAP, y: cy + (top ? -54 : 54)})
    }
  }
  return {tables, seats}
}

function layout(n: number): Scene {
  return n <= 14 ? stadium(n) : rows(n)
}

const COLORS = ['#0E0E0E', '#8A8783', '#4A4744', '#B9B5AE', '#2B2926', '#6E6A65']

function Diner({color}: {color: string}) {
  return (
    <g className="diner-pop">
      <circle r={15} fill={color} />
      <circle r={6} fill="#F4F1EB" opacity={0.9} />
    </g>
  )
}

export default function PeopleTables({value, onChange}: {value: number; onChange: (n: number) => void}) {
  const unit = value > MAX_SHAPES ? Math.ceil(value / MAX_SHAPES) : 1
  const shapes = Math.ceil(value / unit)
  const {tables, seats} = layout(shapes)

  // Encuadre: la escena se centra y se achica hasta entrar en pantalla.
  const xs = [...tables.flatMap((t) => [t.x, t.x + t.w]), ...seats.flatMap((s) => [s.x - 15, s.x + 15])]
  const ys = [...tables.flatMap((t) => [t.y, t.y + t.h]), ...seats.flatMap((s) => [s.y - 15, s.y + 15])]
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const scale = Math.min(1.7, (W - 80) / (maxX - minX), (H - 60) / (maxY - minY))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  /* ---------- botones − / + con "mantener apretado" ---------- */
  const latest = useRef(value)
  latest.current = value
  const timers = useRef<{t?: number; i?: number}>({})
  const stop = () => {
    clearTimeout(timers.current.t)
    clearInterval(timers.current.i)
  }
  useEffect(() => stop, [])
  const apply = (delta: number) => {
    const next = Math.min(9999, Math.max(0, latest.current + delta))
    latest.current = next
    onChange(next)
  }
  const press = (delta: number) => {
    apply(delta)
    timers.current.t = window.setTimeout(() => {
      timers.current.i = window.setInterval(() => apply(delta * (latest.current >= 40 ? 5 : 1)), 80)
    }, 380)
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-[46vh]"
        role="img"
        aria-label={`Mesa con ${value} ${value === 1 ? 'persona' : 'personas'}`}
      >
        <g
          style={{
            transform: `translate(${W / 2}px, ${H / 2}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`,
            transition: 'transform .7s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {tables.map((t, i) => (
            <rect
              key={i}
              x={t.x}
              y={t.y}
              width={t.w}
              height={t.h}
              rx={t.rx}
              fill="#D9D6D0"
              stroke="#0E0E0E"
              strokeWidth={2}
              style={{
                x: t.x,
                y: t.y,
                width: t.w,
                height: t.h,
                rx: t.rx,
                transition: 'all .7s cubic-bezier(.2,.8,.2,1)',
              }}
            />
          ))}
          {seats.map((s, i) => (
            <g
              key={i}
              style={{transform: `translate(${s.x}px, ${s.y}px)`, transition: 'transform .6s cubic-bezier(.2,.8,.2,1)'}}
            >
              <Diner color={COLORS[i % COLORS.length]} />
            </g>
          ))}
          {value === 0 && (
            <text textAnchor="middle" y={6} className="meta" fill="#8A8783" style={{fontSize: 14, letterSpacing: '.14em'}}>
              SUMÁ GENTE
            </text>
          )}
        </g>
      </svg>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          aria-label="Una persona menos"
          onPointerDown={() => press(-1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), apply(-1))}
          className="h-14 w-14 rounded-full border border-ink font-serif text-3xl leading-none hover:bg-ink hover:text-paper transition-colors touch-none"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={9999}
          aria-label="Cantidad de personas"
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(Math.min(9999, Math.max(0, parseInt(e.target.value, 10) || 0)))}
          className="wiz-input !w-32 text-center"
        />
        <button
          type="button"
          aria-label="Una persona más"
          onPointerDown={() => press(1)}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), apply(1))}
          className="h-14 w-14 rounded-full border border-ink font-serif text-3xl leading-none hover:bg-ink hover:text-paper transition-colors touch-none"
        >
          +
        </button>
        {unit > 1 && <span className="meta text-g1">CADA FIGURA = {unit} PERSONAS</span>}
      </div>
    </div>
  )
}
