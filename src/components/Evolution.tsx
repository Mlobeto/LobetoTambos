import { siteConfig } from '../config/site'
import { siteImages } from '../config/images'
import { BackgroundImage } from './BackgroundImage'

export function Evolution() {
  const { heritage } = siteConfig

  return (
    <BackgroundImage
      src={siteImages.tradicion}
      alt=""
      overlayClassName="bg-brand-50/92"
    >
      <section id="evolucion" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-lobeto-red">
              Permanencia y actualidad
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-900 sm:text-4xl">
              {heritage.title}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-brand-700">
              {heritage.lead}
            </p>
          </div>

        

          <p className="mx-auto mt-12 max-w-2xl text-center text-xl font-medium text-lobeto-navy">
            {siteConfig.tagline}
          </p>
        </div>
      </section>
    </BackgroundImage>
  )
}
