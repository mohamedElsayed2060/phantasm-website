'use client'

import { useEffect, useMemo, useState } from 'react'
import AnimatedAsset from './AnimatedAsset'

/**
 * BuildingsLayer
 * - If hotspot discovered => show building
 * - Plays spawn once, then switches to loop
 * - Click on building triggers onBuildingClick(spot)
 *
 * Notes:
 * - We rely on isDiscovered(id) being persisted (local/session) by useIslandDiscovery.
 * - If discovered on refresh, we skip spawn and go directly to loop by default.
 */
export default function BuildingsLayer({
  bgReady,
  canvasSize,
  hotspots,
  isDiscovered,
  onBuildingClick,
  onBuilt,
}) {
  const [phaseById, setPhaseById] = useState(() => ({}))
  // phase: 'none' | 'spawning' | 'built'

  // Build a stable list of discovered ids
  const discoveredIds = useMemo(() => {
    return (hotspots || [])
      .map((h) => h?.id)
      .filter(Boolean)
      .filter((id) => isDiscovered?.(id))
  }, [hotspots, isDiscovered])

  // Whenever a spot becomes discovered:
  // - if first time in this session, play spawn (if provided)
  // - if already phase exists, keep it
  // - if not, default to 'built' when page is loaded with discovered true (no spawn)
  useEffect(() => {
    if (!bgReady) return
    setPhaseById((prev) => {
      const next = { ...prev }
      for (const id of discoveredIds) {
        if (!next[id]) {
          // If it was discovered already (e.g. from refresh), start as built.
          // If you want spawn ALWAYS, switch this to 'spawning' and rely on spawn asset.
          next[id] = 'built'
        }
      }
      return next
    })
  }, [bgReady, discoveredIds])
  useEffect(() => {
    const onDisc = (e) => {
      const id = e?.detail?.id
      if (!id) return
      setPhaseById((prev) => ({ ...prev, [id]: 'spawning' }))
    }
    window.addEventListener('phantasm:discovered', onDisc)
    return () => window.removeEventListener('phantasm:discovered', onDisc)
  }, [])

  if (!bgReady) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {hotspots?.map((h) => {
        const id = h?.id
        if (!id) return null
        if (!isDiscovered?.(id)) return null

        const left = (Number(h.x || 0) / 100) * canvasSize.w
        const top = (Number(h.y || 0) / 100) * canvasSize.h

        const building = h?.building
        const anchor = building?.anchor || { x: 50, y: 92 }

        const spawn = building?.spawn
        const loop = building?.loop

        // If we have spawn and we want it after click (same session),
        // you can set it when discover happens.
        // For now: if you want spawn to play once after click, set phase to spawning externally.
        const phase = phaseById[id] || 'built'

        // Measure: we use spawn size first, fallback to loop size
        const assetForSize = phase === 'spawning' ? spawn : loop
        const w = assetForSize?.w || 220
        const hPx = assetForSize?.h || 220

        // Anchor positioning: spot x/y is where "foot" should be.
        const x = left - (w * (anchor.x ?? 50)) / 100
        const y = top - (hPx * (anchor.y ?? 92)) / 100

        return (
          <button
            data-building="1"
            key={id}
            type="button"
            className="absolute pointer-events-auto"
            style={{
              left: x,
              top: y,
              width: w,
              height: hPx,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onBuildingClick?.(h)
            }}
            aria-label={h?.label || 'Building'}
          >
            {/* Spawn */}
            {phase === 'spawning' && spawn ? (
              <AnimatedAsset
                asset={{ ...spawn, loop: false }}
                pixelated
                onDone={() => {
                  setPhaseById((prev) => ({ ...prev, [id]: 'built' }))
                  // ✅ notify parent that spawn finished for this spot
                  onBuilt?.(h)
                }}
                style={{ pointerEvents: 'none' }}
              />
            ) : null}

            {/* Loop / built */}
            {phase !== 'spawning' && loop ? (
              <AnimatedAsset
                asset={{ ...loop, loop: true }}
                pixelated
                style={{ pointerEvents: 'none' }}
              />
            ) : null}

            {/* If no assets yet, placeholder */}
            {!spawn && !loop ? (
              <div
                style={{
                  width: w,
                  height: hPx,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.12)',
                  outline: '1px solid rgba(255,255,255,0.15)',
                }}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
