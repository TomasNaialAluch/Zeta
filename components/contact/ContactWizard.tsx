'use client'
import {useEffect, useRef, useState} from 'react'
import DatePicker, {formatLongDate} from '@/components/contact/DatePicker'
import PeopleTables from '@/components/contact/PeopleTables'
import ThankYou from '@/components/contact/ThankYou'
import {site} from '@/content/site'

type Answers = {
  nombre: string
  contacto: string
  tipo: string
  fecha: string // ISO yyyy-mm-dd o ''
  personas: number // 0 = sin definir
  mensaje: string
  restricciones: string[] // opciones rápidas elegidas
  restrNota: string // texto libre: alergias, detalles
}

type StepId = 'nombre' | 'contacto' | 'tipo' | 'fecha' | 'personas' | 'mensaje' | 'revisar'

const STEPS: {id: StepId; label: string; question: string; optional?: boolean}[] = [
  {id: 'nombre', label: 'NOMBRE', question: '¿Cómo te llamás?'},
  {id: 'contacto', label: 'CONTACTO', question: '¿Cómo te contactamos?'},
  {id: 'tipo', label: 'EVENTO', question: '¿Qué tenés en mente?'},
  {id: 'fecha', label: 'FECHA', question: '¿Para cuándo?', optional: true},
  {id: 'personas', label: 'PERSONAS', question: '¿Cuántos van a ser?', optional: true},
  {id: 'mensaje', label: 'MENSAJE', question: 'Contanos un poco más.', optional: true},
  {id: 'revisar', label: 'REVISAR', question: 'Revisá y mandá.'},
]
const LAST = STEPS.length - 1
const RESTRICTIONS = ['Vegetariano', 'Vegano', 'Sin TACC', 'Sin lácteos', 'Frutos secos', 'Mariscos', 'Sin alcohol']
const EVENT_TYPES = ['Private Dining', 'Event', 'Pop Up', 'Collaboration', 'Otro']
const EMPTY: Answers = {nombre: '', contacto: '', tipo: '', fecha: '', personas: 0, mensaje: '', restricciones: [], restrNota: ''}
const DRAFT_KEY = 'zeta-contacto'

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
const isPhone = (v: string) => /^[+()\-\s\d]+$/.test(v) && v.replace(/\D/g, '').length >= 8

/** Devuelve el mensaje de error del paso, o '' si está bien. */
function validate(id: StepId, a: Answers): string {
  if (id === 'nombre' && !a.nombre.trim()) return 'Necesitamos tu nombre.'
  if (id === 'contacto') {
    const v = a.contacto.trim()
    if (!v) return 'Dejanos un email o un WhatsApp.'
    if (!isEmail(v) && !isPhone(v)) return 'Revisá que sea un email o un número válido.'
  }
  if (id === 'tipo' && !a.tipo) return 'Elegí una opción.'
  return ''
}

const restrictionsText = (a: Answers) => [...a.restricciones, a.restrNota.trim()].filter(Boolean).join(', ')

export default function ContactWizard() {
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [a, setA] = useState<Answers>(EMPTY)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const restored = useRef(false)

  const current = STEPS[step]
  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setA((prev) => ({...prev, [key]: value}))
    setError('')
  }

  /* Borrador: si recargás la página no perdés lo escrito. */
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (saved) setA({...EMPTY, ...JSON.parse(saved)})
    } catch {}
    restored.current = true
  }, [])
  useEffect(() => {
    if (!restored.current) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(a))
    } catch {}
  }, [a])

  // Cada paso nuevo lleva el foco a su campo.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus({preventScroll: true}), 80)
    return () => clearTimeout(t)
  }, [step])

  const go = (to: number) => {
    if (to < 0 || to > LAST) return
    setDir(to >= step ? 1 : -1)
    setStep(to)
    setMaxStep((m) => Math.max(m, to))
    setError('')
  }

  const next = () => {
    const problem = validate(current.id, a)
    if (problem) return setError(problem)
    go(step + 1)
  }

  const skip = () => {
    if (current.id === 'fecha') set('fecha', '')
    if (current.id === 'personas') set('personas', 0)
    go(step + 1)
  }

  async function send() {
    setStatus('sending')
    try {
      const body = {
        nombre: a.nombre.trim(),
        contacto: a.contacto.trim(),
        tipo: a.tipo,
        fecha: a.fecha ? formatLongDate(a.fecha) : 'Sin definir',
        personas: a.personas ? String(a.personas) : 'Sin definir',
        mensaje: a.mensaje.trim(),
        restricciones: restrictionsText(a) || 'Ninguna',
      }
      const response = await fetch('/api/contact', {method: 'POST', body: JSON.stringify(body)})
      if (response.ok) {
        try {
          sessionStorage.removeItem(DRAFT_KEY)
        } catch {}
      }
      setStatus(response.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (current.id === 'revisar') send()
    else next()
  }

  if (status === 'ok') return <ThankYou name={a.nombre.trim().split(' ')[0]} />

  const progress = (step / LAST) * 100

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col" noValidate>
      {/* Progreso + breadcrumb */}
      <div className="mb-10">
        <div
          className="h-px bg-g2 relative"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progreso del formulario"
        >
          <div
            className="absolute inset-y-0 left-0 h-[2px] -top-[0.5px] bg-ink transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{width: `${progress}%`}}
          />
        </div>
        <ol className="flex gap-x-5 md:gap-x-8 mt-4 overflow-x-auto whitespace-nowrap pb-1">
          {STEPS.map((s, i) => {
            const reachable = i <= maxStep
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => go(i)}
                  aria-current={i === step ? 'step' : undefined}
                  className={`meta transition-opacity ${
                    i === step ? 'underline underline-offset-4' : i < step ? 'opacity-100' : 'opacity-30'
                  } ${reachable && i !== step ? 'hover:opacity-60' : ''}`}
                >
                  {i < step ? '✓ ' : ''}
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Pregunta actual */}
      <div key={step} className={`flex-1 ${dir === 1 ? 'wiz-in-fwd' : 'wiz-in-back'}`} aria-live="polite">
        <p className="meta text-g1 mb-3">
          {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          {current.optional ? ' — OPCIONAL' : ''}
        </p>
        <h2 className="font-serif text-4xl md:text-7xl leading-[0.95] tracking-tight mb-8 md:mb-10">{current.question}</h2>

        {current.id === 'nombre' && (
          <input
            ref={inputRef}
            value={a.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            autoComplete="name"
            placeholder="Tu nombre"
            aria-label="Nombre"
            className="wiz-input max-w-3xl"
          />
        )}

        {current.id === 'contacto' && (
          <>
            <input
              ref={inputRef}
              value={a.contacto}
              onChange={(e) => set('contacto', e.target.value)}
              autoComplete="email"
              placeholder="email o WhatsApp"
              aria-label="Email o WhatsApp"
              className="wiz-input max-w-3xl"
            />
            <p className="meta text-g1 mt-3">Escribinos lo que te quede más cómodo.</p>
          </>
        )}

        {current.id === 'tipo' && (
          <div className="flex flex-wrap gap-3 max-w-3xl" role="radiogroup" aria-label="Tipo de evento">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={a.tipo === t}
                onClick={() => {
                  set('tipo', t)
                  setTimeout(() => go(step + 1), 350)
                }}
                className={`font-serif text-2xl md:text-4xl px-6 py-3 border border-ink rounded-full transition-colors duration-200 ${
                  a.tipo === t ? 'bg-ink text-paper' : 'hover:bg-g2/70'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {current.id === 'fecha' && (
          <div className="md:flex md:gap-12 md:items-start">
            <DatePicker value={a.fecha} onChange={(iso) => set('fecha', iso)} />
            <p className="font-serif text-3xl md:text-5xl mt-6 md:mt-10 md:max-w-md min-h-[2.5em] leading-tight">
              {a.fecha ? <em>{formatLongDate(a.fecha)}</em> : <span className="text-g2">Elegí un día.</span>}
            </p>
          </div>
        )}

        {current.id === 'personas' && <PeopleTables value={a.personas} onChange={(n) => set('personas', n)} />}

        {current.id === 'mensaje' && (
          <textarea
            ref={inputRef}
            value={a.mensaje}
            onChange={(e) => set('mensaje', e.target.value)}
            rows={5}
            placeholder="Menú, ocasión, ideas… lo que quieras."
            aria-label="Mensaje"
            className="wiz-input max-w-3xl resize-none !text-2xl md:!text-3xl"
          />
        )}

        {current.id === 'mensaje' && (
          <div className="mt-8 max-w-3xl">
            <p className="meta text-g1 mb-1">RESTRICCIONES O ALERGIAS — OPCIONAL</p>
            <p className="meta mb-3 text-[#E2573B]">Marcalas y las dejamos afuera del menú.</p>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Restricciones alimentarias">
              {RESTRICTIONS.map((r) => {
                const on = a.restricciones.includes(r)
                return (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set('restricciones', on ? a.restricciones.filter((x) => x !== r) : [...a.restricciones, r])
                    }
                    className={`meta px-4 py-2 border rounded-full transition-colors duration-200 ${
                      on
                        ? 'bg-[#E2573B] border-[#E2573B] text-paper'
                        : 'border-ink hover:border-[#E2573B] hover:text-[#E2573B]'
                    }`}
                  >
                    {on ? '✕ ' : ''}
                    {r}
                  </button>
                )
              })}
            </div>
            <input
              value={a.restrNota}
              onChange={(e) => set('restrNota', e.target.value)}
              placeholder="Alergias, intolerancias, algo que debamos saber…"
              aria-label="Alergias y otras restricciones"
              className="wiz-input !text-xl md:!text-2xl"
            />
          </div>
        )}

        {current.id === 'revisar' && (
          <dl className="max-w-3xl divide-y divide-g2 border-y border-g2">
            {(
              [
                ['nombre', 'NOMBRE', a.nombre],
                ['contacto', 'CONTACTO', a.contacto],
                ['tipo', 'EVENTO', a.tipo],
                ['fecha', 'FECHA', a.fecha ? formatLongDate(a.fecha) : ''],
                ['personas', 'PERSONAS', a.personas ? String(a.personas) : ''],
                ['mensaje', 'MENSAJE', a.mensaje],
                ['restricciones', 'RESTRICCIONES', restrictionsText(a)],
              ] as const
            ).map(([id, label, value]) => (
              <div key={id} className="flex items-baseline gap-4 py-4">
                <dt className="meta text-g1 w-24 shrink-0">{label}</dt>
                <dd className="font-serif text-xl md:text-2xl flex-1 break-words">{value || <span className="text-g1">—</span>}</dd>
                <button
                  type="button"
                  onClick={() => go(STEPS.findIndex((s) => s.id === (id === 'restricciones' ? 'mensaje' : id)))}
                  className="meta underline underline-offset-4 hover:opacity-60"
                >
                  EDITAR
                </button>
              </div>
            ))}
          </dl>
        )}

        {error && (
          <p role="alert" className="meta mt-4">
            {error}
          </p>
        )}
        {status === 'err' && (
          <p role="alert" className="meta mt-4">
            Algo falló. Probá por Instagram: @{site.ig}
          </p>
        )}
      </div>

      {/* Controles */}
      <div className="mt-10 flex items-center gap-6">
        {step > 0 && (
          <button type="button" onClick={() => go(step - 1)} className="meta hover:opacity-60 transition-opacity">
            ← VOLVER
          </button>
        )}
        {current.optional && (
          <button type="button" onClick={skip} className="meta text-g1 hover:text-ink transition-colors">
            {current.id === 'fecha' ? 'TODAVÍA NO SÉ' : current.id === 'personas' ? 'NO SÉ TODAVÍA' : 'SALTEAR'}
          </button>
        )}
        {current.id !== 'tipo' && (
          <button
            type="submit"
            disabled={status === 'sending'}
            className="ml-auto h-14 px-8 bg-ink text-paper meta hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {current.id === 'revisar' ? (status === 'sending' ? 'ENVIANDO…' : 'ENVIAR CONSULTA') : 'SIGUIENTE →'}
          </button>
        )}
      </div>
    </form>
  )
}
