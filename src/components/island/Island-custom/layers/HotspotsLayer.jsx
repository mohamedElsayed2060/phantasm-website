'use client'

import React, { useEffect, useRef } from 'react'
import { getHotspotWorldPoint } from '../helpers'

const HOVER_DELAY_MS = 160

const isCoarsePointer =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(hover: none), (pointer: coarse)').matches

export default function HotspotsLayer({
  hotspots = [],
  mapSize,
  discoveredIds,
  spawningId,
  onHotspotClick,
}) {
  const hoverTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  return (
    <>
      {hotspots.map((spot) => {
        const sid = String(spot?.id)
        const isDiscovered = discoveredIds?.has ? discoveredIds.has(sid) : false
        const isSpawning = String(spawningId) === sid

        if (isDiscovered || isSpawning) return null

        const point = getHotspotWorldPoint(spot, mapSize)
        const size = Number(spot?.hotspotSize || 25)

        const trigger = spot?.trigger || 'click'
        const allowHover = trigger === 'hover' && !isCoarsePointer

        return (
          <button
            key={sid}
            type="button"
            data-hotspot-button="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: size,
              height: size,
              zIndex: 10,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (trigger !== 'hover' || isCoarsePointer) onHotspotClick?.(spot)
            }}
            onMouseEnter={() => {
              if (!allowHover) return

              if (String(spawningId) === sid) return
              if (discoveredIds?.has && discoveredIds.has(sid)) return

              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
              hoverTimerRef.current = setTimeout(() => {
                onHotspotClick?.(spot)
              }, HOVER_DELAY_MS)
            }}
            onMouseLeave={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            }}
            aria-label={spot?.name || spot?.label || `Hotspot ${sid}`}
          >
            <span className="relative block w-full h-full">
              <img
                src={spot?.hotspotIdleSrc}
                alt={spot?.name || spot?.label || `Hotspot ${sid}`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="absolute inset-0 h-full w-full object-contain"
                style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
              />
            </span>
          </button>
        )
      })}
    </>
  )
}
