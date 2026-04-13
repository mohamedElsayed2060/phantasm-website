'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { getHotspotLabel, getHotspotWorldPoint } from '../helpers'

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function BaseSprite({ spot, mapSize, src, onClick, zIndex = 12 }) {
  if (!src) return null
  if (!isFiniteNumber(spot?.buildingW) || !isFiniteNumber(spot?.buildingH)) return null

  const point = getHotspotWorldPoint(spot, mapSize)
  const w = spot.buildingW
  const h = spot.buildingH
  const ax = Number.isFinite(spot?.anchorX) ? spot.anchorX : 0.5
  const ay = Number.isFinite(spot?.anchorY) ? spot.anchorY : 0.9

  return (
    <button
      type="button"
      data-hotspot-button="true"
      className="absolute cursor-pointer"
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
        zIndex,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(spot)
      }}
      aria-label={`${getHotspotLabel(spot)} building`}
    >
      <img
        src={src}
        alt={`${getHotspotLabel(spot)} building`}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        decoding="async"
        className="block h-full w-full object-contain"
        style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
      />
    </button>
  )
}

export default function BuildingsLayer({
  hotspots = [],
  mapSize,
  discoveredIds,
  spawningId,
  onBuiltBuildingClick,
}) {
  const PRE_REVEAL_MS = 10
  const [preRevealId, setPreRevealId] = useState(null)

  const discovered = useMemo(() => {
    return hotspots.filter((spot) => {
      const sid = String(spot?.id)
      return discoveredIds?.has?.(sid) && sid !== String(spawningId)
    })
  }, [hotspots, discoveredIds, spawningId])

  const spawningSpot = useMemo(() => {
    if (!spawningId) return null
    return hotspots.find((spot) => String(spot?.id) === String(spawningId)) || null
  }, [hotspots, spawningId])

  useEffect(() => {
    if (!spawningSpot?.id) {
      setPreRevealId(null)
      return
    }

    setPreRevealId(null)

    const spawnMs = Number(spawningSpot?.spawnDurationMs ?? 1700)
    const revealAt = Math.max(0, spawnMs - PRE_REVEAL_MS)

    const timer = window.setTimeout(() => {
      setPreRevealId(String(spawningSpot.id))
    }, revealAt)

    return () => window.clearTimeout(timer)
  }, [spawningSpot])

  return (
    <>
      {spawningSpot ? (
        <>
          {preRevealId === String(spawningSpot.id) ? (
            <BaseSprite
              spot={spawningSpot}
              mapSize={mapSize}
              src={spawningSpot?.buildingLoopSrc}
              zIndex={12}
              onClick={onBuiltBuildingClick}
            />
          ) : null}

          <BaseSprite
            spot={spawningSpot}
            mapSize={mapSize}
            src={spawningSpot?.buildingSpawnSrc}
            zIndex={13}
            onClick={onBuiltBuildingClick}
          />
        </>
      ) : null}

      {discovered.map((spot) => (
        <BaseSprite
          key={String(spot?.id)}
          spot={spot}
          mapSize={mapSize}
          src={spot?.buildingLoopSrc}
          zIndex={12}
          onClick={onBuiltBuildingClick}
        />
      ))}
    </>
  )
}
