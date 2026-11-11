import type Lenis from 'lenis'

/**
 * Referencia compartida a la instancia de Lenis (scroll suave).
 * Los scrolls programáticos (índice en rueda, "subir al inicio", cambio de página)
 * mueven la página con `jumpTo` en cada frame, así Lenis siempre sabe dónde está.
 * (No usar `lenis.stop()`: agrega overflow:clip al <html> y bloquea hasta window.scrollTo.)
 */
let instance: Lenis | null = null

export function setLenis(lenis: Lenis | null) {
  instance = lenis
}

/** Pone la página en una posición exacta, sin animación propia de Lenis. */
export function jumpTo(y: number) {
  if (instance) instance.scrollTo(y, {immediate: true, force: true})
  else window.scrollTo(0, y)
}
