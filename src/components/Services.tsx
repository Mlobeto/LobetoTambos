import { getWhatsAppUrl, siteConfig } from '../config/site'
import { WhatsAppIcon } from './WhatsAppIcon'

const serviceIcons = ['🥛', '☀️', '💻', '🤝']

export function Services() {
  const { technicalService } = siteConfig

  return (
    <section id="servicios" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            Servicios
          </h2>
          <p className="mt-4 text-brand-700">
            La misma confianza de siempre, con las herramientas que el tambo
            necesita hoy: equipamiento, energía solar, tecnología digital y{' '}
            <span className="font-semibold text-lobeto-red">
              servicio técnico las 24 horas
            </span>
            .
          </p>
        </div>

        <article className="relative mt-12 overflow-hidden rounded-2xl border-2 border-lobeto-navy bg-lobeto-navy shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-lobeto-red/20 blur-2xl" />
          <div className="relative grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div>
              <span className="inline-flex items-center rounded-full bg-lobeto-red px-4 py-1.5 text-sm font-bold tracking-wider text-white">
                {technicalService.badge}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                {technicalService.title}
              </h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-brand-100">
                {technicalService.description}
              </p>
              <ul className="mt-6 flex flex-wrap gap-3">
                {technicalService.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={getWhatsAppUrl(
                'Hola, necesito el servicio técnico de Lobeto Tambos.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-lobeto-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-lobeto-red-dark lg:self-center"
            >
              <WhatsAppIcon className="h-5 w-5" iconClassName="text-white" />
              Solicitar asistencia
            </a>
          </div>
        </article>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.services.map((service, index) => (
            <article
              key={service.title}
              className="rounded-xl border border-brand-200 bg-brand-50/50 p-6 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl" role="img" aria-hidden="true">
                {serviceIcons[index]}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-brand-900">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-700">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
