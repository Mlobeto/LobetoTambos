import { getWhatsAppUrl } from '../config/site'
import { WhatsAppIcon } from './WhatsAppIcon'

export function WhatsAppButton() {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-lobeto-navy bg-white text-lobeto-red shadow-lg transition-all hover:scale-105 hover:bg-lobeto-navy hover:text-white hover:shadow-xl"
    >
      <WhatsAppIcon className="h-7 w-7" iconClassName="currentColor" />
    </a>
  )
}
