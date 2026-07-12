import type { ReactNode } from 'react'
import { siteImages } from '../config/images'

type BackgroundImageProps = {
  src: string
  alt?: string
  overlayClassName?: string
  className?: string
  children: ReactNode
}

export function BackgroundImage({
  src,
  alt = '',
  overlayClassName = 'bg-lobeto-navy/70',
  className = '',
  children,
}: BackgroundImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${src}")` }}
        role="img"
        aria-label={alt || undefined}
      />
      <div
        className={`absolute inset-0 ${overlayClassName}`}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

type ImagePanelProps = {
  src: string
  alt: string
  label: string
  caption?: string
  className?: string
}

export function ImagePanel({
  src,
  alt,
  label,
  caption,
  className = '',
}: ImagePanelProps) {
  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-brand-200 shadow-lg ${className}`}>
      <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-100 to-brand-200">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-lobeto-navy/20 p-6 text-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lobeto-navy">
            {label}
          </span>
          {caption && (
            <p className="mt-3 max-w-xs text-sm font-medium text-white drop-shadow-md">
              {caption}
            </p>
          )}
        </div>
      </div>
    </figure>
  )
}

export { siteImages }
