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
  activeHotspotId,
  onActivate,
  onDeactivate,
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
        const allowTooltipHover = !isCoarsePointer
        const allowHoverTrigger = trigger === 'hover' && !isCoarsePointer
        const label = spot?.name || spot?.label || `Hotspot ${sid}`
        const isActive = String(activeHotspotId) === sid

        return (
          <button
            key={sid}
            type="button"
            data-hotspot-button="true"
            className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${point.x}px`,
              top: `${point.y}px`,
              width: size,
              height: size,
              zIndex: isActive ? 14 : 10,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              onDeactivate?.()

              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

              if (trigger !== 'hover' || isCoarsePointer) {
                onHotspotClick?.(spot)
              }
            }}
            onMouseEnter={() => {
              if (String(spawningId) === sid) return
              if (discoveredIds?.has && discoveredIds.has(sid)) return

              if (allowTooltipHover) {
                onActivate?.(spot)
              }

              if (allowHoverTrigger) {
                if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
                hoverTimerRef.current = setTimeout(() => {
                  onHotspotClick?.(spot)
                }, HOVER_DELAY_MS)
              }
            }}
            onMouseLeave={() => {
              onDeactivate?.()

              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            }}
            aria-label={label}
          >
            <span className="relative block h-full w-full">
              <img
                src={spot?.hotspotIdleSrc}
                alt={label}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.06]"
                style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
              />
            </span>
          </button>
        )
      })}
    </>
  )
}
