'use client'

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
  onLoad,
}) {
  const [loaded, setLoaded] = useState(false)
  const safeSrc = useMemo(() => String(src || '').trim(), [src])

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

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        // ✅ modern browsers: perfect
        aspectRatio: ratio.replace(':', '/'),
      }}
    >
      {/* ✅ fallback spacer (لو aspect-ratio مش مدعوم لأي سبب) */}
      <div aria-hidden style={{ paddingTop }} />

      {skeleton && !loaded ? <div className="absolute inset-0 animate-pulse bg-black/10" /> : null}

      <img
        src={safeSrc}
        alt={alt}
        draggable={false}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={(e) => {
          setLoaded(true)
          onLoad?.(e)
        }}
        className={`absolute inset-0 w-full h-full ${objectCls} select-none transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${imgClassName}`}
      />
    </div>
  )
}
