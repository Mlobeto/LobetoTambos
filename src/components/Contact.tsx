import { getWhatsAppUrl, siteConfig } from '../config/site'
import { WhatsAppIcon } from './WhatsAppIcon'

export function Contact() {
  return (
    <section id="contacto" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            Contacto
          </h2>
          <p className="mt-4 text-brand-700">
            ¿Tenés un tambo o querés saber más sobre nuestros servicios? Escribinos
            y te respondemos a la brevedad.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center rounded-xl border-2 border-lobeto-navy bg-brand-50/50 p-8 text-center transition-all hover:border-lobeto-red hover:shadow-lg"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-lobeto-navy bg-white">
              <WhatsAppIcon className="h-7 w-7" iconClassName="text-lobeto-red" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-lobeto-navy">
              WhatsApp
            </h3>
            <p className="mt-2 text-sm text-brand-700">
              La forma más rápida de contactarnos
            </p>
            <span className="mt-4 text-sm font-medium text-lobeto-red group-hover:underline">
              Abrir chat →
            </span>
          </a>

          <div className="flex flex-col items-center rounded-xl border border-brand-200 bg-brand-50/50 p-8 text-center">
            <span className="text-4xl">✉️</span>
            <h3 className="mt-4 text-lg font-semibold text-brand-900">Email</h3>
            <p className="mt-2 text-sm text-brand-700">{siteConfig.email}</p>
            <p className="mt-4 text-sm text-brand-600">{siteConfig.location}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
