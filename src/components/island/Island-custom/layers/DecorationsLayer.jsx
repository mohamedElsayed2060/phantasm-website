'use client'

import React, { useMemo } from 'react'
import { resolveAxis } from '../helpers'

export default function DecorationsLayer({ items = [], mapSize }) {
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items])

  const computedDecorations = useMemo(() => {
    return list
      .map((d) => {
        if (
          !Number.isFinite(d?.x) ||
          !Number.isFinite(d?.y) ||
          !Number.isFinite(d?.w) ||
          !Number.isFinite(d?.h)
        ) {
          return null
        }

        const x = resolveAxis(d.x, mapSize.w)
        const y = resolveAxis(d.y, mapSize.h)

        const ax = Number.isFinite(d?.anchorX) ? d.anchorX : 0.5
        const ay = Number.isFinite(d?.anchorY) ? d.anchorY : 0.5

        const left = x - ax * d.w
        const top = y - ay * d.h

        const transform = [
          `translate3d(${left}px, ${top}px, 0)`,
          d.rotate ? `rotate(${d.rotate}deg)` : '',
          d.flipX ? 'scaleX(-1)' : '',
        ]
          .filter(Boolean)
          .join(' ')

        return { d, transform }
      })
      .filter(Boolean)
  }, [list, mapSize.h, mapSize.w])

  if (!list.length) return null

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
      {computedDecorations.map(({ d, transform }, idx) => (
        <img
          key={`${d.name}-${idx}`}
          src={d.src}
          alt={d.name || ''}
          draggable={false}
          decoding="async"
          loading="lazy"
          style={{
            position: 'absolute',
            width: `${d.w}px`,
            height: `${d.h}px`,
            transform,
            transformOrigin: '0 0',
            opacity: Number.isFinite(d?.opacity) ? d.opacity : 1,
            imageRendering: 'pixelated',
            userSelect: 'none',
          }}
        />
      ))}
    </div>
  )
}
