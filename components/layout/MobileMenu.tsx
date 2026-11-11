import NavLink from '@/components/layout/NavLink'
import {navLinks} from '@/content/navigation'
import {site} from '@/content/site'

export default function MobileMenu({onNavigate}: {onNavigate: () => void}) {
  return (
    <div className="fixed inset-0 z-40 bg-ink text-paper flex flex-col justify-center gap-4 px-5">
      {navLinks.map(({label, href}) => (
        <NavLink key={href} href={href} onNavigate={onNavigate} className="font-serif text-7xl py-1">
          {label}
        </NavLink>
      ))}
      <span className="meta absolute bottom-6">@{site.ig}</span>
    </div>
  )
}
