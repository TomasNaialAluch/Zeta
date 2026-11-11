'use client'
import {useEffect, useState} from 'react'

const SCROLL_THRESHOLD_PX = 40
const DARK_LUMINANCE_LIMIT = 110

/** Luminancia percibida (0–255) de un color "rgb(...)" / "rgba(...)". */
function luminance([r, g, b]: number[]) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Busca el primer fondo visible (alfa > 0.5) justo debajo del header,
 * subiendo por los ancestros del elemento que esté en ese punto.
 */
function isDarkBelow(headerHeight: number): boolean {
  const elements = document.elementsFromPoint(window.innerWidth / 2, headerHeight + 2)
  for (const element of elements) {
    let node: Element | null = element
    while (node && node !== document.documentElement) {
      const channels = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number)
      if (channels && (channels.length < 4 || channels[3] > 0.5)) {
        return luminance(channels) < DARK_LUMINANCE_LIMIT
      }
      node = node.parentElement
    }
  }
  return false
}

/**
 * Estado de scroll para el header:
 * - `scrolled`: el usuario bajó más de SCROLL_THRESHOLD_PX.
 * - `overDark`: el contenido que pasa debajo del header tiene fondo oscuro.
 */
export function useScrollState() {
  const [scrolled, setScrolled] = useState(false)
  const [overDark, setOverDark] = useState(false)

  useEffect(() => {
    const update = () => {
      const header = document.querySelector('header')
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX)
      setOverDark(isDarkBelow(header?.clientHeight ?? 64))
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return {scrolled, overDark}
}
