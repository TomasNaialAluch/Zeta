'use client'
import {useEffect, useRef, useState} from 'react'
import {useRouter} from 'next/navigation'
import {gsap} from 'gsap'

/** Mismas tiras de especias del Hero, en orden de arcoíris. */
const SPICES = [
  'aji-rojo-fresco',
  'aji-rojo-abundancia',
  'aji-seco-rojo',
  'aji-seco-pila',
  'morron-rojo',
  'paprika-polvo',
  'pimienta-rosa',
  'morron-amarillo-naranja',
  'azafran-hebras',
  'curcuma-polvo',
  'morron-amarillo-apilado',
  'oregano-hojas',
  'morron-verde',
  'pimientas-roja-blanca-negra',
  'pimientas-mixtas',
  'canela-en-rama',
  'anis-estrella',
  'pimienta-negra-granos',
]

const TILES_PER_COLUMN = 4
// Reparto de altura de los 4 rectángulos de cada columna (varía por columna).
const SPLITS = [
  [30, 22, 26, 22],
  [22, 30, 20, 28],
  [26, 20, 32, 22],
  [20, 28, 24, 28],
]
const TOTAL_S = 15
const GRACE_MS = 3000 // los primeros segundos ignoran toques (por si venían de apretar "Enviar")

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const RESET = {
  scale: 1,
  y: 0,
  rotationY: 0,
  filter: 'brightness(1) saturate(1)',
  boxShadow: '0 0 0px rgba(255,255,255,0)',
  zIndex: 0,
}

/**
 * Pantalla final del formulario.
 *
 * La primera animación es siempre la misma y dura 15 s:
 *  0–5 s   caen rectángulos con especias y llenan la pantalla, inclinados como el Hero.
 *  5–9 s   brillan cada vez más intensamente, de a uno.
 *  9–15 s  "clics": cada tanto un rectángulo se agranda como si lo tocaran.
 * Después nunca se queda quieta: encadena escenas al azar (ola, lluvia, cinta, reflector,
 * giro, cartas, protagonista, clics), sin repetir hasta haber pasado por todas. Con tocar la pantalla
 * (o Esc) se vuelve al inicio. Encima, siempre, "Gracias." y el aviso del envío a ZETA.
 */
export default function ThankYou({name}: {name: string}) {
  const root = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setColumns(window.innerWidth < 768 ? 7 : 14)
  }, [])

  useEffect(() => {
    if (!columns || !root.current) return
    const host = root.current
    const soft = window.matchMedia('(prefers-reduced-motion: reduce)').matches // destellos más suaves
    const H = window.innerHeight
    const W = window.innerWidth

    let dead = false
    let active: gsap.core.Timeline | null = null
    const mountedAt = performance.now()

    const ctx = gsap.context(() => {
      const stage = host.querySelector<HTMLElement>('[data-stage]')!
      const cols = Array.from(host.querySelectorAll<HTMLElement>('[data-col]'))
      const tiles = Array.from(host.querySelectorAll<HTMLElement>('[data-tile]'))
      const text = host.querySelectorAll('[data-text]')
      const veil = host.querySelector('[data-veil]')
      const hint = host.querySelector('[data-hint]')

      const setSpice = (tile: HTMLElement, spice: string) => {
        const img = tile.querySelector('img')
        if (img) img.src = `/especias/lomos/${spice}.webp`
      }
      const sheenOf = (tile: HTMLElement) => tile.querySelector('[data-sheen]')
      const centerTiles = () => {
        const mid = tiles.filter((tile) => {
          const r = tile.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          return cx > innerWidth * 0.12 && cx < innerWidth * 0.88 && cy > innerHeight * 0.12 && cy < innerHeight * 0.88
        })
        return mid.length ? mid : tiles
      }
      const pad = (tl: gsap.core.Timeline, seconds: number) => {
        tl.to({}, {duration: 0.001}, seconds)
        return tl
      }
      const finish = (tl: gsap.core.Timeline) => tl.to(tiles, {...RESET, duration: 0.5, ease: 'power2.out'})

      gsap.set(stage, {rotation: -9, transformOrigin: '50% 50%'})
      gsap.set(tiles, {autoAlpha: 0})
      gsap.set(text, {autoAlpha: 0, y: 30})
      gsap.set([veil, hint], {autoAlpha: 0})

      /* Un "clic": anillo + el rectángulo se agranda como si lo tocaran y vuelve. */
      const click = () => {
        const tile = pick(centerTiles())
        const r = tile.getBoundingClientRect()
        const ring = document.createElement('div')
        ring.setAttribute('aria-hidden', 'true')
        ring.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:60px;height:60px;margin:-30px 0 0 -30px;border:2px solid rgba(255,255,255,.9);border-radius:50%;pointer-events:none;z-index:55`
        host.appendChild(ring)
        gsap.fromTo(ring, {scale: 0.2, autoAlpha: 1}, {scale: 5, autoAlpha: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ring.remove()})
        gsap
          .timeline()
          .set(tile, {zIndex: 30})
          .to(tile, {scale: soft ? 1.8 : 3.2, filter: 'brightness(2) saturate(1.5)', duration: 0.4, ease: 'power3.out'})
          .to(tile, {scale: 1, filter: 'brightness(1) saturate(1)', duration: 0.8, ease: 'power2.inOut', delay: 0.3})
          .set(tile, {zIndex: 0})
      }

      /* ---------- Escena inicial (siempre igual, 15 s) ---------- */
      const intro = () => {
        const tl = gsap.timeline({defaults: {ease: 'none'}})
        tl.fromTo(stage, {scale: 1}, {scale: 1.35, duration: TOTAL_S}, 0)

        // 1) Caen de a uno y se apilan de abajo hacia arriba, columna por columna.
        cols.forEach((col, c) => {
          const colTiles = Array.from(col.querySelectorAll<HTMLElement>('[data-tile]'))
          colTiles.forEach((tile, t) => {
            const at = 0.3 + c * 0.17 + t * 0.34 + Math.random() * 0.25
            tl.set(tile, {autoAlpha: 1}, at)
            tl.fromTo(tile, {y: -H * 1.4}, {y: 0, duration: 1.05, ease: 'bounce.out'}, at)
          })
        })

        // 2) Brillan de a uno, cada vez más intensos y más seguido.
        const glowStart = 5
        const glowEnd = 9.2
        for (let at = glowStart; at < glowEnd; ) {
          const progress = (at - glowStart) / (glowEnd - glowStart)
          const tile = pick(tiles)
          const peak = (soft ? 1.5 : 1.7) + progress * (soft ? 0.5 : 1.3)
          const sheen = sheenOf(tile)
          tl.to(
            tile,
            {
              filter: `brightness(${peak}) saturate(${1.2 + progress * 0.6})`,
              boxShadow: `0 0 ${30 + progress * 60}px rgba(255,255,255,${0.25 + progress * 0.4})`,
              duration: 0.22,
              ease: 'power2.out',
              yoyo: true,
              repeat: 1,
              zIndex: 2,
            },
            at,
          )
          if (sheen) tl.fromTo(sheen, {x: '-130%'}, {x: '130%', duration: 0.7, ease: 'power1.inOut'}, at)
          at += 0.26 - progress * 0.12 // 0.26 s al principio, 0.14 s al final
        }
        tl.to(stage, {filter: `brightness(${soft ? 1.15 : 1.3}) saturate(1.25)`, duration: 1.4, ease: 'power1.inOut'}, glowEnd - 1.2)

        // 3) "Clics".
        for (let at = 9.4; at < TOTAL_S - 0.8; at += 1.05) tl.call(click, [], at)

        // Texto: aparece enseguida y se queda para siempre.
        tl.to(veil, {autoAlpha: 1, duration: 1.6, ease: 'power1.out'}, 0.8)
        tl.to(text, {autoAlpha: 1, y: 0, duration: 1.4, ease: 'power3.out', stagger: 0.5}, 1)
        tl.to(hint, {autoAlpha: 1, duration: 1}, GRACE_MS / 1000 + 1)
        return tl
      }

      /* ---------- Escenas al azar (después de la inicial) ---------- */
      const toStage = (tl: gsap.core.Timeline, rotation: number, scale: number, d = 2) =>
        tl.to(stage, {rotation, scale, filter: 'brightness(1.1) saturate(1.15)', duration: d, ease: 'sine.inOut'}, 0)

      const scenes: Record<string, () => gsap.core.Timeline> = {
        // Una ola de brillo que cruza la pared (de lado a lado, de arriba abajo o desde el centro).
        ola: () => {
          const tl = gsap.timeline()
          toStage(tl, -9 + rand(-3, 3), rand(1.15, 1.4))
          const mode = pick(['x', 'xr', 'y', 'radial'])
          const info = tiles.map((t) => {
            const r = t.getBoundingClientRect()
            return {t, x: r.left + r.width / 2, y: r.top + r.height / 2}
          })
          const key = (i: {x: number; y: number}) =>
            clamp01(
              mode === 'x'
                ? i.x / W
                : mode === 'xr'
                  ? 1 - i.x / W
                  : mode === 'y'
                    ? i.y / H
                    : Math.hypot(i.x - W / 2, i.y - H / 2) / Math.hypot(W / 2, H / 2),
            )
          for (let pass = 0; pass < 2; pass++) {
            info.forEach((i) => {
              const at = 0.5 + pass * 3 + key(i) * 2.4
              tl.to(
                i.t,
                {
                  scale: soft ? 1.06 : 1.14,
                  filter: `brightness(${soft ? 1.6 : 2.1}) saturate(1.5)`,
                  boxShadow: '0 0 50px rgba(255,255,255,.45)',
                  zIndex: 2,
                  duration: 0.38,
                  ease: 'power2.out',
                  yoyo: true,
                  repeat: 1,
                },
                at,
              )
              const sh = sheenOf(i.t)
              if (sh) tl.fromTo(sh, {x: '-130%'}, {x: '130%', duration: 0.6}, at)
            })
          }
          return finish(tl)
        },

        // Todo se cae hacia abajo y vuelve a llover con otras especias.
        lluvia: () => {
          const tl = gsap.timeline()
          tl.to(tiles, {y: H * 1.5, duration: 0.8, ease: 'power2.in', stagger: {each: 0.025, from: 'random'}}, 0.2)
          const off = Math.floor(rand(0, SPICES.length))
          tl.call(() => tiles.forEach((t, idx) => setSpice(t, SPICES[(idx * 5 + off) % SPICES.length])), [], 2.5)
          tl.set(tiles, {y: -H * 1.5}, 2.5)
          cols.forEach((col, c) => {
            Array.from(col.querySelectorAll<HTMLElement>('[data-tile]')).forEach((tile, t) => {
              tl.to(tile, {y: 0, duration: 1.05, ease: 'bounce.out'}, 2.6 + c * 0.12 + t * 0.28 + Math.random() * 0.2)
            })
          })
          return finish(tl)
        },

        // Las columnas suben y bajan como una cinta transportadora.
        cinta: () => {
          const tl = gsap.timeline()
          toStage(tl, -9 + rand(-4, 4), rand(1.2, 1.45), 1.5)
          tl.to(
            cols,
            {y: (i: number) => (i % 2 ? 1 : -1) * H * 0.16, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: 1, stagger: 0.12},
            0,
          )
          tl.to(tiles, {filter: 'brightness(1.5) saturate(1.3)', duration: 0.6, yoyo: true, repeat: 1, stagger: {each: 0.07, from: 'random'}}, 1)
          return finish(pad(tl, 7))
        },

        // Todo se apaga y un reflector va eligiendo rectángulos al azar.
        reflector: () => {
          const tl = gsap.timeline()
          const dim = 'brightness(.28) saturate(.8)'
          tl.to(tiles, {filter: dim, duration: 0.8}, 0)
          for (let n = 0; n < 6; n++) {
            const at = 1 + n * 1.05
            const tile = pick(centerTiles())
            tl.to(
              tile,
              {
                filter: 'brightness(2.2) saturate(1.5)',
                scale: soft ? 1.3 : 1.8,
                zIndex: 30,
                boxShadow: '0 0 70px rgba(255,255,255,.55)',
                duration: 0.45,
                ease: 'power3.out',
              },
              at,
            )
            tl.to(tile, {filter: dim, scale: 1, zIndex: 0, boxShadow: '0 0 0px rgba(255,255,255,0)', duration: 0.5, ease: 'power2.inOut'}, at + 0.75)
          }
          return finish(pad(tl, 7.6))
        },

        // Giro y zoom de toda la pared.
        giro: () => {
          const tl = gsap.timeline()
          const [rot, sc] = pick([
            [-24, 1.7],
            [-17, 1.55],
            [14, 1.6],
            [22, 1.8],
          ])
          tl.to(stage, {rotation: rot, scale: sc, filter: 'brightness(1.15) saturate(1.2)', duration: 3.2, ease: 'sine.inOut'}, 0)
          tl.to(stage, {rotation: -9 + rand(-2, 2), scale: rand(1.15, 1.35), duration: 3.2, ease: 'sine.inOut'}, 3.4)
          tl.to(tiles, {filter: 'brightness(1.6) saturate(1.4)', duration: 0.5, yoyo: true, repeat: 1, stagger: {each: 0.05, from: 'random'}}, 0.5)
          return finish(tl)
        },

        // Rectángulos que se dan vuelta como cartas y muestran otra especia.
        cartas: () => {
          const tl = gsap.timeline()
          toStage(tl, -9 + rand(-3, 3), rand(1.15, 1.4))
          shuffle(tiles)
            .slice(0, 16)
            .forEach((t, i) => {
              const at = 0.3 + i * 0.32
              tl.to(t, {rotationY: 90, transformPerspective: 700, zIndex: 5, duration: 0.35, ease: 'power2.in'}, at)
              tl.call(() => setSpice(t, pick(SPICES)), [], at + 0.35)
              tl.to(t, {rotationY: 0, duration: 0.45, ease: 'back.out(1.6)'}, at + 0.35)
              tl.to(t, {zIndex: 0, duration: 0.01}, at + 0.85)
            })
          return finish(tl)
        },

        // Una especia al azar se agranda hasta ocupar toda la pantalla y vuelve a su lugar al revés.
        // Se anima un clon fijo (no el rectángulo): así llega derecho a pantalla completa aunque la pared esté inclinada.
        protagonista: () => {
          const tl = gsap.timeline()
          const tile = pick(centerTiles())
          const r = tile.getBoundingClientRect()
          const stageScale = Number(gsap.getProperty(stage, 'scale')) || 1
          const stageRot = Number(gsap.getProperty(stage, 'rotation')) || 0
          const w = tile.offsetWidth * stageScale
          const h = tile.offsetHeight * stageScale
          const from = {left: r.left + r.width / 2 - w / 2, top: r.top + r.height / 2 - h / 2, width: w, height: h, rotation: stageRot}

          const clone = document.createElement('div')
          clone.setAttribute('data-zoomclone', '')
          clone.setAttribute('aria-hidden', 'true')
          clone.style.cssText = 'position:fixed;overflow:hidden;pointer-events:none;background:#111'
          const img = document.createElement('img')
          img.src = tile.querySelector('img')?.src ?? ''
          img.alt = ''
          img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover'
          clone.appendChild(img)
          host.insertBefore(clone, host.querySelector('[data-veil]')) // queda debajo del texto
          gsap.set(clone, {...from, autoAlpha: 0, transformOrigin: '50% 50%'})

          const ring = document.createElement('div')
          ring.setAttribute('aria-hidden', 'true')
          ring.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;width:60px;height:60px;margin:-30px 0 0 -30px;border:2px solid rgba(255,255,255,.9);border-radius:50%;pointer-events:none;z-index:55;opacity:0`
          host.appendChild(ring)

          // Selección: anillo, el resto se oscurece y el elegido pasa a ser el clon.
          tl.fromTo(ring, {scale: 0.2, autoAlpha: 1}, {scale: 5, autoAlpha: 0, duration: 0.8, ease: 'power2.out'}, 0.3)
          tl.to(tiles, {filter: 'brightness(.45) saturate(.9)', duration: 0.5}, 0.3)
          tl.set(clone, {autoAlpha: 1}, 0.45)
          tl.set(tile, {autoAlpha: 0}, 0.45)
          // Ida: crece hasta ocupar toda la pantalla.
          tl.to(clone, {left: 0, top: 0, width: W, height: H, rotation: 0, duration: 1.2, ease: 'power3.inOut'}, 0.5)
          tl.fromTo(img, {scale: 1}, {scale: 1.15, duration: 3.1, ease: 'sine.inOut'}, 0.5)
          if (!soft) tl.fromTo(clone, {filter: 'brightness(1.8) saturate(1.4)'}, {filter: 'brightness(1) saturate(1)', duration: 1.2, ease: 'power2.out'}, 0.5)
          // Vuelta: el efecto inverso, hasta su lugar.
          tl.to(clone, {...from, duration: 1.2, ease: 'power3.inOut'}, 3.4)
          tl.to(img, {scale: 1, duration: 1.2, ease: 'power3.inOut'}, 3.4)
          tl.set(tile, {autoAlpha: 1}, 4.6)
          tl.set(clone, {autoAlpha: 0}, 4.6)
          tl.to(tiles, {filter: 'brightness(1) saturate(1)', duration: 0.6}, 4.6)
          tl.call(() => {
            clone.remove()
            ring.remove()
          }, [], 5.3)
          return finish(pad(tl, 5.4))
        },

        // Una ráfaga de clics.
        clics: () => {
          const tl = gsap.timeline()
          toStage(tl, -9 + rand(-3, 3), rand(1.2, 1.5))
          for (let i = 0; i < 5; i++) tl.call(click, [], 0.6 + i * 1.2)
          return finish(pad(tl, 7.4))
        },
      }

      // Bolsa de escenas: se recorren todas (en orden al azar) antes de repetir ninguna.
      let bag: string[] = []
      let last = ''
      const next = () => {
        if (dead) return
        if (!bag.length) {
          bag = shuffle(Object.keys(scenes))
          if (bag[bag.length - 1] === last) bag.reverse() // no repetir la última de la ronda anterior
        }
        const sceneName = bag.pop()!
        last = sceneName
        const tl = scenes[sceneName]()
        active = tl
        tl.eventCallback('onComplete', next)
      }

      active = intro()
      active.eventCallback('onComplete', next)
    }, host)

    /* Tocar la pantalla (o Esc) → volver al inicio. */
    const leave = () => {
      if (dead || performance.now() - mountedAt < GRACE_MS) return
      dead = true
      active?.kill()
      gsap.to(host, {autoAlpha: 0, duration: 0.5, onComplete: () => router.push('/')})
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && leave()
    host.addEventListener('pointerdown', leave)
    window.addEventListener('keydown', onKey)

    return () => {
      dead = true
      host.removeEventListener('pointerdown', leave)
      window.removeEventListener('keydown', onKey)
      ctx.revert()
      host.querySelectorAll('[data-zoomclone]').forEach((el) => el.remove())
    }
  }, [columns, router])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[60] bg-ink text-paper overflow-hidden cursor-pointer"
      role="status"
      aria-live="polite"
    >
      {/* Pared de rectángulos con especias */}
      <div
        data-stage
        className="absolute flex gap-[6px]"
        style={{left: '-20%', top: '-20%', width: '140%', height: '140%'}}
        aria-hidden
      >
        {Array.from({length: columns}, (_, c) => {
          const split = SPLITS[c % SPLITS.length]
          return (
            <div key={c} data-col className="flex-1 flex flex-col-reverse gap-[6px]">
              {split.slice(0, TILES_PER_COLUMN).map((h, t) => {
                const spice = SPICES[(c * 5 + t * 7) % SPICES.length]
                return (
                  <div key={t} data-tile className="ty-tile" style={{flex: `${h} 1 0`}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/especias/lomos/${spice}.webp`}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span data-sheen className="ty-sheen" />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Velo oscuro detrás del texto para que siempre se lea */}
      <div
        data-veil
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(14,14,14,.82) 0%, rgba(14,14,14,.5) 50%, rgba(14,14,14,0) 100%)',
        }}
      />

      {/* Texto */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <h2
          data-text
          className="font-serif leading-[.85] tracking-tight"
          style={{fontSize: 'clamp(4.5rem, 21vw, 19rem)', textShadow: '0 4px 40px rgba(0,0,0,.6)'}}
        >
          Gracias.
        </h2>
        <p
          data-text
          className="font-serif text-2xl md:text-4xl mt-6 md:mt-8 max-w-3xl"
          style={{textShadow: '0 2px 24px rgba(0,0,0,.8)'}}
        >
          {name ? `${name}, ` : ''}todo lo que nos contaste <em>ya está en ZETA.</em>
        </p>
        <p data-text className="meta mt-5" style={{textShadow: '0 2px 16px rgba(0,0,0,.9)'}}>
          Te escribimos pronto.
        </p>
      </div>

      <p
        data-hint
        className="absolute bottom-6 inset-x-0 text-center meta pointer-events-none"
        style={{textShadow: '0 2px 16px rgba(0,0,0,.9)'}}
      >
        TOCÁ LA PANTALLA PARA VOLVER AL INICIO
      </p>
    </div>
  )
}
