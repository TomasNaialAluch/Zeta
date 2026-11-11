'use client'
import {useState} from 'react'
import {site} from '@/content/site'

type Status = 'idle' | 'sending' | 'ok' | 'err'

// [name, label, input type]
const FIELDS = [
  ['nombre', 'NOMBRE', 'text'],
  ['contacto', 'EMAIL / WHATSAPP', 'text'],
  ['fecha', 'FECHA', 'date'],
  ['personas', 'CANTIDAD DE PERSONAS', 'number'],
] as const

const OPTIONAL_FIELDS = ['fecha', 'personas']
const EVENT_TYPES = ['Private Dining', 'Event', 'Pop Up', 'Collaboration', 'Otro']

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    try {
      const data: Record<string, string> = {}
      new FormData(event.currentTarget).forEach((value, key) => {
        data[key] = String(value)
      })
      const response = await fetch('/api/contact', {method: 'POST', body: JSON.stringify(data)})
      setStatus(response.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    }
  }

  if (status === 'ok') {
    return <p className="font-serif text-4xl mt-16">Recibido. Te escribimos pronto.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="mt-12 max-w-2xl space-y-6">
      {FIELDS.map(([name, label, type]) => (
        <label key={name} className="block meta">
          {label}
          <input
            name={name}
            type={type}
            inputMode={name === 'personas' ? 'numeric' : undefined}
            required={!OPTIONAL_FIELDS.includes(name)}
            className="mt-1"
          />
        </label>
      ))}

      <label className="block meta">
        TIPO DE EVENTO
        <select name="tipo" className="mt-1">
          {EVENT_TYPES.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>

      <label className="block meta">
        CONTAME QUÉ TENÉS EN MENTE
        <textarea name="mensaje" rows={4} className="mt-1" />
      </label>

      <button
        disabled={status === 'sending'}
        className="w-full h-14 bg-ink text-paper meta hover:opacity-80 transition-opacity"
      >
        {status === 'sending' ? 'ENVIANDO…' : 'ENVIAR CONSULTA'}
      </button>

      {status === 'err' && <p className="meta">Algo falló. Probá por Instagram: @{site.ig}</p>}
    </form>
  )
}
