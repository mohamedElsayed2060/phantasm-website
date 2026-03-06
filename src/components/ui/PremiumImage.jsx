'use client'

import NextImage from 'next/image'
import { useEffect, useMemo, useState } from 'react'

function toPaddingTop(ratio) {
  // ratio like "16/10" or "16:9"
  const s = String(ratio || '').trim()
  const parts = s.includes('/') ? s.split('/') : s.split(':')
  const w = Number(parts?.[0])
  const h = Number(parts?.[1])
  if (!w || !h) return '56.25%' // fallback 16:9
  return `${(h / w) * 100}%`
}

export default function PremiumImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  ratio = '16/10',
  contain = true,
  priority = false,
  skeleton = true,
  sizes = '100vw',
  quality = 75,
  unoptimized = false,
  pixelated = false,
  onLoad,
}) {
  const [loaded, setLoaded] = useState(false)
  const safeSrc = useMemo(() => String(src || '').trim(), [src])
  const shouldBypassOptimization = useMemo(() => {
    return /\.gif($|\?)/i.test(safeSrc) || /\.svg($|\?)/i.test(safeSrc)
  }, [safeSrc])

  useEffect(() => {
    setLoaded(false)
  }, [safeSrc])

  useEffect(() => {
    if (!priority || !safeSrc) return
    const img = new Image()
    img.src = safeSrc
    img.decode?.().catch(() => {})
  }, [priority, safeSrc])

  if (!safeSrc) return null

  const objectCls = contain ? 'object-contain' : 'object-cover'
  const paddingTop = toPaddingTop(ratio)
  const blurDataURL =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIiBmaWxsPSIjMTAxMDEwIi8+PC9zdmc+'

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        // modern browsers: perfect
        aspectRatio: ratio.replace(':', '/'),
      }}
    >
      <div aria-hidden style={{ paddingTop }} />

      {skeleton && !loaded ? <div className="absolute inset-0 animate-pulse bg-black/10" /> : null}

      <NextImage
        src={safeSrc}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        unoptimized={unoptimized || shouldBypassOptimization}
        placeholder={skeleton ? 'blur' : 'empty'}
        blurDataURL={skeleton ? blurDataURL : undefined}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        className={`absolute inset-0 w-full h-full ${objectCls} select-none transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
        style={pixelated ? { imageRendering: 'pixelated' } : undefined}
      />
    </div>
  )
}
