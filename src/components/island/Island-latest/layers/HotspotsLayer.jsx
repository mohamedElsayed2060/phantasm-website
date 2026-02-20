'use client'

import React from 'react'
import { percentToPxX, percentToPxY } from '../utils'

export default function HotspotsLayer({
  map,
  hotspots,
  discoveredIds,
  spawningId,
  onHotspotClick,
}) {
  if (!map?.ready) return null

  return (
    <>
      {hotspots.map((spot) => {
        const sid = String(spot.id)
        const isDiscovered = discoveredIds.has(sid)
        const isSpawning = String(spawningId) === sid
        if (isDiscovered || isSpawning) return null

        const pxX = percentToPxX(spot.x, map.w)
        const pxY = percentToPxY(spot.y, map.h)
        const size = Number(spot.hotspotSize || 64)

        return (
          <button
            key={sid}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${pxX}px`, top: `${pxY}px`, width: size, height: size, zIndex: 10 }}
            onClick={() => onHotspotClick(spot)}
          >
            <span className="relative block w-full h-full">
              {/* glow */}
              {/* <span className="absolute inset-0 rounded-full opacity-30 animate-ping bg-white" /> */}
              {/* gif */}
              <img
                src={spot.hotspotIdleSrc}
                alt={spot.name}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
              />
            </span>
          </button>
        )
      })}
    </>
  )
}
