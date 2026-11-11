'use client'
import {useState} from 'react'
import NavLink from '@/components/layout/NavLink'
import MobileMenu from '@/components/layout/MobileMenu'
import {navLinks} from '@/content/navigation'
import {useScrollState} from '@/hooks/useScrollState'

const BASE = 'fixed top-0 inset-x-0 z-50 flex justify-between items-center px-5 md:px-10 h-16 border-b transition-[background-color,backdrop-filter,color,border-color] duration-300'
const GLASS = 'backdrop-blur-xl backdrop-saturate-150'

// Arriba de todo: texto blanco con inversión de color sobre cualquier fondo.
const TOP = 'text-white mix-blend-difference border-transparent'
// Con scroll: vidrio oscuro con texto blanco, o vidrio claro con texto negro.
const GLASS_DARK = `${GLASS} bg-ink/55 text-white border-white/10 shadow-[0_1px_20px_rgba(0,0,0,0.25)]`
const GLASS_LIGHT = `${GLASS} bg-paper/55 text-ink border-white/40 shadow-[0_1px_20px_rgba(0,0,0,0.06)]`

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const {scrolled, overDark} = useScrollState()

  const closeMenu = () => setMenuOpen(false)
  const tone = scrolled && !menuOpen ? (overDark ? GLASS_DARK : GLASS_LIGHT) : TOP

  return (
    <>
      <header className={`${BASE} ${tone}`}>
        <NavLink href="/" className="font-serif text-2xl" onNavigate={closeMenu}>
          ZETA
        </NavLink>
        <nav className="hidden md:flex gap-8 meta">
          {navLinks.map(({label, href}) => (
            <NavLink key={href} href={href} className="hover:opacity-60 transition-opacity">
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          className="md:hidden meta h-12 px-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? 'CLOSE' : 'MENU'}
        </button>
      </header>
      {menuOpen && <MobileMenu onNavigate={closeMenu} />}
    </>
  )
}
