export function About() {
  return (
    <section id="nosotros" className="bg-brand-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              Sobre Lobeto Tambos
            </h2>
            <p className="mt-6 leading-relaxed text-brand-700">
              Desde las ordeñadoras hasta la energía solar: generaciones de
              productores nos conocen en los caminos de la región. Esa trayectoria
              nos impulsa a seguir evolucionando con el mismo compromiso de siempre.
            </p>
            <p className="mt-4 text-xl font-medium text-lobeto-red">
              Porque el tambo no puede parar.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Décadas de presencia en los caminos de la región',
              'Compromiso con productores y tambos',
              'Herramientas que evolucionan con el campo',
              'Contacto directo por WhatsApp',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-lg border border-brand-200 bg-white px-5 py-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lobeto-navy text-xs font-bold text-white">
                  ✓
                </span>
                <span className="text-brand-800">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
