'use client'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {usePageTransition} from '@/components/layout/PageTransition'
import {scrollToTop} from '@/lib/scrollToTop'

type NavLinkProps = {
  href: string
  className?: string
  onNavigate?: () => void
  children: React.ReactNode
}

/**
 * Link de navegación: va a la página indicada, pero si ya estás en ella
 * no recarga y sube lentamente hasta el inicio.
 */
export default function NavLink({href, className, onNavigate, children}: NavLinkProps) {
  const pathname = usePathname()
  const navigate = usePageTransition()

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onNavigate?.()
    // Respeta ctrl/cmd/shift/click del medio (abrir en pestaña nueva).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    // Misma página: sube con scroll lento. Otra página: efecto hoja de revista.
    if (pathname === href) scrollToTop()
    else navigate(href)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
