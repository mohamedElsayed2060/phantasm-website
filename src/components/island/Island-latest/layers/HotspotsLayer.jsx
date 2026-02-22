'use client'

import React, { useEffect, useRef } from 'react'
import { percentToPxX, percentToPxY } from '../utils'

export default function HotspotsLayer({
  map,
  hotspots,
  discoveredIds,
  spawningId,
  onHotspotClick,
}) {
  const hoverTimerRef = useRef(null)
  const startPosRef = useRef({ x: 0, y: 0 })
  const lastMoveRef = useRef(0)
  useEffect(() => {
    return () => hoverTimerRef.current && clearTimeout(hoverTimerRef.current)
  }, [])

  // ✅ hover مش موجود على touch devices
  const isCoarsePointer =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: none), (pointer: coarse)').matches

  const HOVER_DELAY_MS = 160
  const HOVER_INTENT_MS = 220
  const MOVE_TOLERANCE_PX = 8
  const RECENT_MOVE_WINDOW_MS = 120

  useEffect(() => {
    const onMove = () => {
      lastMoveRef.current = Date.now()
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  if (!map?.ready) return null

  return (
    <>
      {hotspots.map((spot) => {
        const sid = String(spot.id)
        const isDiscovered = discoveredIds?.has ? discoveredIds.has(sid) : false
        const isSpawning = String(spawningId) === sid
        if (isDiscovered || isSpawning) return null

        const pxX = percentToPxX(spot.x, map.w)
        const pxY = percentToPxY(spot.y, map.h)
        const size = Number(spot.hotspotSize || 64)

        const trigger = spot?.trigger || 'click'
        const allowHover = trigger === 'hover' && !isCoarsePointer

        return (
          <button
            key={sid}
            type="button"
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${pxX}px`, top: `${pxY}px`, width: size, height: size, zIndex: 10 }}
            onClick={() => {
              // ✅ click/tap دايمًا شغال (خصوصًا للموبايل)
              if (trigger !== 'hover' || isCoarsePointer) onHotspotClick(spot)
            }}
            onMouseEnter={() => {
              if (!allowHover) return

              // ✅ أمان إضافي
              if (String(spawningId) === sid) return
              if (discoveredIds?.has && discoveredIds.has(sid)) return

              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
              hoverTimerRef.current = setTimeout(() => {
                onHotspotClick(spot)
              }, HOVER_DELAY_MS)
            }}
            onMouseLeave={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            }}
          >
            <span className="relative block w-full h-full">
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
