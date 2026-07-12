import { getWhatsAppUrl, siteConfig } from '../config/site'
import { siteImages } from '../config/images'
import { BackgroundImage } from './BackgroundImage'

export function SolarEnergy() {
  const { solar } = siteConfig

  return (
    <BackgroundImage
      src={siteImages.energiaSolar}
      alt="Paneles solares en un tambo"
      overlayClassName="bg-gradient-to-r from-lobeto-navy/92 via-lobeto-navy/78 to-lobeto-navy/45"
      className="text-white"
    >
      <section id="energia-solar" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-lobeto-red">
              {solar.title}
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{solar.tagline}</h2>
            <p className="mt-4 text-lg text-brand-100">{solar.subtitle}</p>
            <p className="mt-6 leading-relaxed text-brand-100/90">{solar.intro}</p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-white">Beneficios</h3>
              <ul className="mt-4 space-y-3">
                {solar.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="mt-0.5 text-lobeto-red">✓</span>
                    <span className="text-sm leading-relaxed text-brand-50">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">Tecnología</h3>
              <ul className="mt-4 space-y-3">
                {solar.technology.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
                  >
                    <span className="mt-0.5 text-lobeto-red">◆</span>
                    <span className="text-sm leading-relaxed text-brand-50">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href={getWhatsAppUrl(
                'Hola, quiero consultar sobre el sistema de energía solar para mi tambo.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-lobeto-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-lobeto-red-dark"
            >
              Consultar por energía solar
            </a>
          </div>
        </div>
      </section>
    </BackgroundImage>
  )
}
