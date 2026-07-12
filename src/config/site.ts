export const siteConfig = {
  name: 'Lobeto Tambos',
  tagline: 'Porque el tambo no puede parar',
  story: [
    'Hay imágenes que cuentan una historia. Durante décadas, los vehículos de LOBETO TAMBOS fueron parte del paisaje de los caminos de nuestra región. Muchos productores los recuerdan recorriendo kilómetros para llegar donde hacía falta una solución.',
    'Hoy las camionetas cambiaron. Cambiaron las herramientas, la tecnología y los equipos con los que trabajamos.',
    'Pero hay algo que permanece: el compromiso de estar cuando un tambo nos necesita.',
  ],
  whatsapp: {
    phone: '5492355517802',
    defaultMessage:
      'Hola, quiero consultar sobre Lobeto Tambos y sus servicios de gestión.',
  },
  email: 'contacto@lobetotambos.com',
  location: 'Lincoln (B), Argentina',
  heritage: {
    title: 'Tradición que permanece',
    lead: 'Lobeto Tambos existe desde que existen las ordeñadoras. Acompañamos al tambo argentino cuando la producción lechera empezaba a transformar el campo.',
    past: 'Durante décadas, nuestros vehículos recorrieron los caminos de la región llevando soluciones donde hacía falta. Esa presencia construyó confianza generación tras generación.',
    present:
      'Hoy incorporamos tecnología digital y energía solar para que cada tambo siga funcionando con mayor seguridad, eficiencia e independencia.',
  },
  solar: {
    title: 'Energía solar',
    tagline: 'La luz se corta. El tambo sigue.',
    subtitle: 'La evolución del molino. La solución definitiva para el agua y la energía en su tambo.',
    intro:
      'Durante años, el molino fue parte del paisaje del campo. Hoy existe una alternativa concreta, eficiente y definitiva: sistemas solares que garantizan agua segura todos los días y continuidad ante cortes de luz.',
    benefits: [
      'El tambo no se detiene ante cortes o baja tensión',
      'Protección total de motores frente a picos de voltaje',
      'Transición automática e instantánea sin apagones',
      'Independencia energética: red eléctrica + solar + baterías',
    ],
    technology: [
      'Paneles solares de alto rendimiento',
      'Banco de baterías de respaldo',
      'Inversor inteligente con gestión automática',
      'Monitor de fase y respuesta en milisegundos',
    ],
  },
  services: [
    {
      title: 'Equipamiento para tambos',
      description:
        'Desde las ordeñadoras hasta los equipos que mantienen la producción en marcha. Soluciones pensadas para la realidad del campo.',
    },
    {
      title: 'Energía solar',
      description:
        'Kits de bomba solar sumergible y sistemas de respaldo para que el tambo no dependa del viento ni de la red.',
    },
    {
      title: 'Tecnología digital',
      description:
        'Herramientas modernas de gestión, monitoreo y comunicación para profesionalizar la operación del establecimiento.',
    },
    {
      title: 'Asesoramiento y presencia',
      description:
        'El mismo compromiso de siempre: estar cuando un tambo nos necesita, con el conocimiento de quien conoce la región.',
    },
  ],
  technicalService: {
    badge: '24 HS',
    title: 'Servicio técnico las 24 horas',
    description:
      'Porque el tambo no puede parar. Respuesta técnica todos los días, a toda hora, para que tu producción no se detenga ante una falla.',
    highlights: [
      'Atención inmediata ante urgencias',
      'Cobertura en la región',
      'Conocimiento de equipos y tambos',
    ],
  },
} as const

export function getWhatsAppUrl(message?: string) {
  const text = encodeURIComponent(message ?? siteConfig.whatsapp.defaultMessage)
  return `https://wa.me/${siteConfig.whatsapp.phone}?text=${text}`
}
