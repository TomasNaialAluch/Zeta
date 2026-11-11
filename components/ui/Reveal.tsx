'use client'
import {useEffect, useRef} from 'react'

/** Hace aparecer a sus hijos (fade + slide) la primera vez que entran en pantalla. */
export default function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current!
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('in')
          observer.disconnect()
        }
      },
      {threshold: 0.1},
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`rv ${className}`}>
      {children}
    </div>
  )
}
