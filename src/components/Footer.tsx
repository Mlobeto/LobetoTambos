import logo from '../assets/logo.png'
import { siteConfig } from '../config/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-brand-200 bg-lobeto-navy py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <img src={logo} alt={siteConfig.name} className="h-[3.75rem] w-auto" />
        <p className="text-sm text-brand-100">
          © {year} {siteConfig.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
