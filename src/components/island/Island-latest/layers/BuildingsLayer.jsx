'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { percentToPxX, percentToPxY } from '../utils'

function BaseSprite({ spot, map, src, onClick, zIndex = 12 }) {
  const pxX = percentToPxX(spot.x, map.w)
  const pxY = percentToPxY(spot.y, map.h)

  const w = Number(spot.buildingW || 240)
  const h = Number(spot.buildingH || 240)

  const ax = Number(spot.anchorX ?? 0.5)
  const ay = Number(spot.anchorY ?? 0.9)

  return (
    <button
      type="button"
      className="absolute cursor-pointer"
      style={{
        left: `${pxX}px`,
        top: `${pxY}px`,
        width: w,
        height: h,
        transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
        zIndex,
      }}
      onClick={onClick}
    >
      <img
        src={src}
        alt={`${spot.name} building`}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        decoding="async"
        className="block w-full h-full object-contain"
        style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
      />
    </button>
  )
}

export default function BuildingsLayer({
  map,
  hotspots,
  discoveredIds,
  spawningId,
  onBuiltBuildingClick,
}) {
  const PRE_REVEAL_MS = 10 // 1 frame تقريبًا، ممكن تخليها 2 لو مصمم بس 16 أثبت

  const [preRevealId, setPreRevealId] = useState(null)

  const discovered = useMemo(
    () =>
      hotspots.filter((h) => {
        const hid = String(h.id)
        return discoveredIds.has(hid) && hid !== String(spawningId)
      }),
    [hotspots, discoveredIds, spawningId],
  )

  const spawningSpot = useMemo(
    () => (spawningId ? hotspots.find((h) => String(h.id) === String(spawningId)) : null),
    [hotspots, spawningId],
  )

  useEffect(() => {
    if (!spawningSpot?.id) {
      setPreRevealId(null)
      return
    }

    setPreRevealId(null)

    const spawnMs = Number(spawningSpot.spawnDurationMs ?? 1700)
    const revealAt = Math.max(0, spawnMs - PRE_REVEAL_MS)

    const revealTimer = window.setTimeout(() => {
      setPreRevealId(String(spawningSpot.id))
    }, revealAt)

    return () => window.clearTimeout(revealTimer)
  }, [spawningSpot])

  if (!map?.ready) return null

  return (
    <>
      {spawningSpot ? (
        <>
          {preRevealId === String(spawningSpot.id) ? (
            <BaseSprite
              spot={spawningSpot}
              map={map}
              src={spawningSpot.buildingLoopSrc}
              zIndex={12}
              onClick={() => onBuiltBuildingClick?.(spawningSpot)}
            />
          ) : null}

          <BaseSprite
            spot={spawningSpot}
            map={map}
            src={spawningSpot.buildingSpawnSrc}
            zIndex={13}
            onClick={() => onBuiltBuildingClick?.(spawningSpot)}
          />
        </>
      ) : null}

      {discovered.map((spot) => (
        <BaseSprite
          key={String(spot.id)}
          spot={spot}
          map={map}
          src={spot.buildingLoopSrc}
          zIndex={12}
          onClick={() => onBuiltBuildingClick?.(spot)}
        />
      ))}
    </>
  )
}
