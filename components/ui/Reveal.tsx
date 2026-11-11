'use client'
import {useEffect, useRef} from 'react'
import {gsap} from 'gsap'

/**
 * Hace aparecer a sus hijos (fade + leve subida) la primera vez que entran en pantalla.
 * Movimiento corto y con frenada larga: se nota que está, pero no distrae.
 */
export default function Reveal({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current!
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(element, {opacity: 1, y: 0})
      return
    }
    let tween: gsap.core.Tween | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        tween = gsap.to(element, {opacity: 1, y: 0, duration: 1.2, ease: 'power3.out'})
      },
      {threshold: 0.1, rootMargin: '0px 0px -8% 0px'},
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      tween?.kill()
    }
  }, [])

  return (
    <div ref={ref} id={id} className={`rv ${className}`}>
      {children}
    </div>
  )
}
