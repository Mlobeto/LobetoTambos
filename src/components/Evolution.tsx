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

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <article className="rounded-2xl border border-brand-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lobeto-navy text-xl text-white">
                ◷
              </div>
              <h3 className="text-xl font-semibold text-lobeto-navy">Ayer</h3>
              <p className="mt-4 leading-relaxed text-brand-700">{heritage.past}</p>
            </article>

            <article className="rounded-2xl border border-lobeto-red/20 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lobeto-red text-xl text-white">
                ◉
              </div>
              <h3 className="text-xl font-semibold text-lobeto-red">Hoy</h3>
              <p className="mt-4 leading-relaxed text-brand-700">
                {heritage.present}
              </p>
            </article>
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-xl font-medium text-lobeto-navy">
            {siteConfig.tagline}
          </p>
        </div>
      </section>
    </BackgroundImage>
  )
}
