'use client'
import {useEffect, useRef, useState} from 'react'

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function formatLongDate(iso: string) {
  return fromIso(iso).toLocaleDateString('es-AR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
}

/** Calendario mes a mes. Los días pasados quedan deshabilitados; no hay fechas "ocupadas". */
export default function DatePicker({value, onChange}: {value: string; onChange: (iso: string) => void}) {
  const now = new Date()
  const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate())
  const start = value ? fromIso(value) : now

  const [view, setView] = useState({y: start.getFullYear(), m: start.getMonth()})
  const [focusIso, setFocusIso] = useState(value || todayIso)
  const gridRef = useRef<HTMLDivElement>(null)
  const moved = useRef(false)

  const first = new Date(view.y, view.m, 1)
  const offset = (first.getDay() + 6) % 7 // semana desde el lunes
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth()
  const monthLabel = first.toLocaleDateString('es-AR', {month: 'long', year: 'numeric'})

  const shiftMonth = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({y: d.getFullYear(), m: d.getMonth()})
  }

  // Teclado: flechas mueven el foco entre días (y cambian de mes si hace falta).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7}[e.key]
    if (!step) return
    e.preventDefault()
    const d = fromIso(focusIso)
    d.setDate(d.getDate() + step)
    const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate())
    if (iso < todayIso) return
    moved.current = true
    setFocusIso(iso)
    setView({y: d.getFullYear(), m: d.getMonth()})
  }

  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusIso}"]`)?.focus()
  }, [focusIso, view])

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)]

  return (
    <div className="max-w-sm select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={isCurrentMonth}
          aria-label="Mes anterior"
          className="meta h-10 w-10 disabled:opacity-20 hover:opacity-60 transition-opacity"
        >
          ←
        </button>
        <span className="meta capitalize" aria-live="polite">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Mes siguiente"
          className="meta h-10 w-10 hover:opacity-60 transition-opacity"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 text-center meta text-g1 mb-1" aria-hidden>
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div ref={gridRef} role="grid" onKeyDown={onKeyDown} className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />
          const iso = toIso(view.y, view.m, day)
          const past = iso < todayIso
          const selected = iso === value
          const isToday = iso === todayIso
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              disabled={past}
              tabIndex={iso === focusIso ? 0 : -1}
              aria-pressed={selected}
              aria-label={formatLongDate(iso)}
              onClick={() => {
                setFocusIso(iso)
                onChange(iso)
              }}
              className={`h-11 font-serif text-xl rounded-full transition-colors duration-200 ${
                selected
                  ? 'bg-ink text-paper'
                  : past
                    ? 'text-g2 cursor-not-allowed'
                    : 'hover:bg-g2/70'
              } ${isToday && !selected ? 'underline underline-offset-4' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
