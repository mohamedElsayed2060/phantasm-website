'use client'

import React, { useMemo } from 'react'
import { percentToPxX, percentToPxY } from '../utils'

export default function DecorationsLayer({ map, items = [] }) {
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items])
  if (!map?.ready || !list.length) return null
  const computedDecorations = useMemo(
    () =>
      list.map((d) => {
        const x = percentToPxX(d.x, map.w)
        const y = percentToPxY(d.y, map.h)
        const left = x - (d.anchorX ?? 0.5) * d.w
        const top = y - (d.anchorY ?? 0.5) * d.h

        const t = [
          `translate3d(${left}px, ${top}px, 0)`,
          d.rotate ? `rotate(${d.rotate}deg)` : '',
          d.flipX ? 'scaleX(-1)' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return { d, t }
      }),
    [list, map.w, map.h],
  )

  if (!map?.ready || !list.length) return null
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
      {computedDecorations.map(({ d, t }, idx) => (
        <img
          key={`${d.name}-${idx}`}
          src={d.src}
          alt={d.name || ''}
          draggable={false}
          decoding="async"
          loading="eager"
          style={{
            position: 'absolute',
            width: `${d.w}px`,
            height: `${d.h}px`,
            transform: t,
            transformOrigin: '0 0',
            opacity: d.opacity ?? 1,
            imageRendering: 'pixelated',
            userSelect: 'none',
          }}
        />
      ))}
    </div>
  )
}
