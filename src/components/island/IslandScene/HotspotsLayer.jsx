'use client'

import { motion } from 'framer-motion'
import AnimatedAsset from './AnimatedAsset'

export default function HotspotsLayer({
  bgReady,
  canvasSize,
  hotspots,
  isDiscovered,
  onHotspotClick, // ✅ new
}) {
  if (!bgReady) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hotspots?.map((h) => {
        const id = h?.id
        const done = isDiscovered?.(id)
        if (!id || done) return null

        const left = (Number(h.x || 0) / 100) * canvasSize.w
        const top = (Number(h.y || 0) / 100) * canvasSize.h

        const icon = h?.hotspot?.idle
        const size = icon?.w || 72

        return (
          <button
            aria-label={h?.label || 'Hotspot'}
            key={id}
            type="button"
            data-hotspot="1"
            className="absolute pointer-events-auto"
            style={{
              left,
              top,
              transform: 'translate(-50%, -50%)',
              width: size,
              height: size,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
            }}
            onClick={() => onHotspotClick?.(h)} // ✅ ONLY this
          >
            {/* <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.92, 1.08, 0.92] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.18) 45%, rgba(255,255,255,0) 70%)',
                filter: 'blur(0.2px)',
              }}
            /> */}

            <div className="absolute inset-0 flex items-center justify-center">
              {icon ? (
                <AnimatedAsset asset={icon} pixelated className="select-none" />
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: 22,
                    height: 22,
                    background: 'rgba(255,255,255,0.9)',
                    boxShadow: '0 0 18px rgba(255,255,255,0.7)',
                  }}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
