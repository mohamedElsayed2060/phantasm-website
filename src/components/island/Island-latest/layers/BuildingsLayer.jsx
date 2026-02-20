'use client'

import React from 'react'
import { percentToPxX, percentToPxY } from '../utils'

function BuildingSprite({ spot, map, mode, onClick }) {
  const pxX = percentToPxX(spot.x, map.w)
  const pxY = percentToPxY(spot.y, map.h)

  const w = Number(spot.buildingW || 240)
  const h = Number(spot.buildingH || 240)

  const ax = Number(spot.anchorX ?? 0.5)
  const ay = Number(spot.anchorY ?? 0.9)

  const src = mode === 'spawn' ? spot.buildingSpawnSrc : spot.buildingLoopSrc

  return (
    <button
      type="button"
      className="absolute"
      style={{
        left: `${pxX}px`,
        top: `${pxY}px`,
        width: w,
        height: h,
        transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
        zIndex: 12,
      }}
      onClick={onClick}
    >
      <img
        src={src}
        alt={`${spot.name} building`}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
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
  if (!map?.ready) return null

  const discovered = hotspots.filter((h) => {
    const hid = String(h.id)
    return discoveredIds.has(hid) && hid !== String(spawningId)
  })

  const spawningSpot = spawningId ? hotspots.find((h) => String(h.id) === String(spawningId)) : null

  return (
    <>
      {spawningSpot ? (
        <BuildingSprite
          spot={spawningSpot}
          map={map}
          mode="spawn"
          onClick={() => onBuiltBuildingClick?.(spawningSpot)}
        />
      ) : null}
      {discovered.map((spot) => (
        <BuildingSprite
          key={String(spot.id)}
          spot={spot}
          map={map}
          mode="built"
          onClick={() => onBuiltBuildingClick?.(spot)}
        />
      ))}
    </>
  )
}
