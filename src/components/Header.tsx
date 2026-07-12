import logo from '../assets/logo.png'
import { siteConfig } from '../config/site'

const navLinks = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#evolucion', label: 'Evolución' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#energia-solar', label: 'Energía solar' },
  { href: '#contacto', label: 'Contacto' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex items-center">
          <img
            src={logo}
            alt={siteConfig.name}
            className="h-[4.5rem] w-auto sm:h-[5.25rem]"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-lobeto-navy transition-colors hover:text-lobeto-red"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#contacto"
          className="rounded-lg bg-lobeto-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-lobeto-navy-dark"
        >
          Consultar
        </a>
      </div>
    </header>
  )
}
