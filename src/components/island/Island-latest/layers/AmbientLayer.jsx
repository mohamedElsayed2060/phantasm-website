'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { percentToPxX, percentToPxY } from '../utils'

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function AmbientLayer({ map, items = [] }) {
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items])
  const [cycles, setCycles] = useState({}) // ✅ per-item cycle for birds only

  const bumpCycle = useCallback((idx) => {
    setCycles((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }))
  }, [])

  if (!map?.ready || !list.length) return null

  // keyframes per item
  const css = list
    .map((a, idx) => `@keyframes amb_${idx}{from{transform:var(--from)}to{transform:var(--to)}}`)
    .join('\n')

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
      <style>{css}</style>

      {list.map((a, idx) => {
        const sx = percentToPxX(a.startX, map.w)
        const sy = percentToPxY(a.startY, map.h)
        const ex = percentToPxX(a.endX, map.w)
        const ey = percentToPxY(a.endY, map.h)

        const ax = a.anchorX ?? 0.5
        const ay = a.anchorY ?? 0.5

        const baseFromLeft = sx - ax * a.w
        const baseFromTop = sy - ay * a.h
        const baseToLeft = ex - ax * a.w
        const baseToTop = ey - ay * a.h

        const count = Math.max(1, Number(a.count ?? 1))
        const isBirds = a.type === 'birds'

        // ✅ only birds randomize each loop
        const cycle = isBirds ? cycles[idx] || 0 : 0

        // deterministic-ish per cycle (no Date.now to avoid extra randomness jitter)
        const rand = mulberry32((idx + 1) * 1337 + cycle * 99991)

        const keyframes = `amb_${idx}`

        return Array.from({ length: count }).map((_, k) => {
          const ox = (rand() - 0.5) * 2 * (a.spreadX ?? 0)
          const oy = (rand() - 0.5) * 2 * (a.spreadY ?? 0)

          // ✅ premium variation for birds only
          const scaleVar = isBirds ? 0.85 + rand() * 0.35 : 1 // 0.85..1.2
          const opacityVar = isBirds
            ? Math.max(0, Math.min(1, (a.opacity ?? 1) * (0.75 + rand() * 0.35)))
            : (a.opacity ?? 1)

          // speed variation (birds only) ±12%
          const baseDur = Math.max(1000, Number(a.durationMs) || 22000)
          const dur = isBirds ? Math.round(baseDur * (0.88 + rand() * 0.24)) : baseDur

          const delay = (a.delayMs ?? 0) + k * (a.staggerMs ?? 0)

          const rot = a.rotate ? `rotate(${a.rotate}deg)` : ''
          const flip = a.flipX ? 'scaleX(-1)' : ''

          const from = `translate3d(${baseFromLeft + ox}px, ${baseFromTop + oy}px, 0) ${rot} ${flip} scale(${scaleVar})`
          const to = `translate3d(${baseToLeft + ox}px, ${baseToTop + oy}px, 0) ${rot} ${flip} scale(${scaleVar})`

          return (
            <img
              key={`${a.name}-${idx}-${k}-${cycle}`}
              src={a.src}
              alt={a.name || a.type || ''}
              draggable={false}
              decoding="async"
              loading="eager"
              // ✅ trigger randomize when a full loop completes (birds only, once per item)
              onAnimationIteration={isBirds && k === 0 ? () => bumpCycle(idx) : undefined}
              style={{
                position: 'absolute',
                width: `${a.w}px`,
                height: `${a.h}px`,
                opacity: opacityVar,
                imageRendering: 'pixelated',
                userSelect: 'none',
                zIndex: isBirds ? 10 : 50,
                // animation
                ['--from']: from,
                ['--to']: to,
                animationName: keyframes,
                animationDuration: `${dur}ms`,
                animationTimingFunction: 'linear',
                animationDelay: `${delay}ms`,
                animationIterationCount: a.loop === false ? 1 : 'infinite',
                animationFillMode: 'both',
                willChange: 'transform',
              }}
            />
          )
        })
      })}
    </div>
  )
}
