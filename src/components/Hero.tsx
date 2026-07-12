import { getWhatsAppUrl, siteConfig } from '../config/site'
import { siteImages } from '../config/images'
import { BackgroundImage, ImagePanel } from './BackgroundImage'
import { WhatsAppIcon } from './WhatsAppIcon'

export function Hero() {
  return (
    <BackgroundImage
      src={siteImages.heroBackground}
      alt="Lobeto Tambos en el campo"
      overlayClassName="bg-gradient-to-r from-white/95 via-white/85 to-white/50"
      className="min-h-[90vh]"
    >
      <section id="inicio" className="relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-lobeto-red/5 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            
            
            <p className="mt-4 text-xl font-medium text-lobeto-red sm:text-2xl">
              {siteConfig.tagline}
            </p>
            <div className="mt-6 max-w-xl space-y-4 text-lg leading-relaxed text-brand-700">
              {siteConfig.story.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-lobeto-navy bg-lobeto-navy px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-lobeto-navy-dark hover:shadow-lg"
              >
                <WhatsAppIcon className="h-5 w-5" iconClassName="text-lobeto-red" />
                Escribinos por WhatsApp
              </a>
              <a
                href="#evolucion"
                className="inline-flex items-center rounded-lg border border-brand-300 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                Nuestra evolución
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <ImagePanel
              src={siteImages.tradicion}
              alt="Historia de Lobeto Tambos en el campo"
              label="Tradición"
              caption="Décadas junto a los productores de la región"
            />
            <ImagePanel
              src={siteImages.actualidad}
              alt="Tecnología y energía solar en Lobeto Tambos"
              label="Actualidad"
              caption="Tecnología digital y energía solar"
            />
          </div>
        </div>
      </section>
    </BackgroundImage>
  )
}
