export const siteImages = {
  heroBackground: '/images/fondo-hero.jpg',
  tradicion: '/images/tradicion.jpeg',
  actualidad: '/images/actualidad.png',
  energiaSolar: '/images/energia-solar.jpg',
} as const

export type SiteImageKey = keyof typeof siteImages
