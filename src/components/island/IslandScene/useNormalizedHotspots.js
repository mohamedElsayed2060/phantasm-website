'use client'

import { useMemo } from 'react'

/**
 * Normalize CMS hotspots into the structure expected by HotspotsLayer / BuildingsLayer.
 * Keeps sizing responsive by scaling asset dimensions against the desktop canvas width.
 */
export default function useNormalizedHotspots({
  hotspots,
  canvasSize,
  desktopCanvasWidth,
  fallbackHotspots,
}) {
  return useMemo(() => {
    const base = Array.isArray(hotspots) && hotspots.length ? hotspots : fallbackHotspots
    const baseW = desktopCanvasWidth
    const sizeScale = baseW ? canvasSize.w / baseW : 1

    return base.map((h) => {
      const iconUrl = h?.hotspotIdleSrc || null
      const buildingLoopUrl = h?.buildingLoopSrc || null
      const buildingSpawnUrl = h?.buildingSpawnSrc || null

      const id = h?.id || h?._id || h?.slug || h?.label

      const buildingW = Math.round(Number(h?.buildingW ?? 220) * sizeScale)
      const buildingH = Math.round(Number(h?.buildingH ?? 220) * sizeScale)

      return {
        ...h,
        id,

        hotspot: iconUrl
          ? {
              idle: {
                type: 'webp',
                src: iconUrl,
                w: Math.round(Number(h?.hotspotIdleW ?? 96) * sizeScale),
                h: Math.round(Number(h?.hotspotIdleH ?? 96) * sizeScale),
              },
            }
          : undefined,

        building: {
          anchor: { x: Number(h?.anchorX ?? 50), y: Number(h?.anchorY ?? 92) },
          spawn: buildingSpawnUrl
            ? {
                type: 'webp',
                src: buildingSpawnUrl,
                w: buildingW,
                h: buildingH,
                durationMs: Number(h?.spawnDurationMs ?? 1400),
              }
            : null,
          loop: buildingLoopUrl
            ? { type: 'webp', src: buildingLoopUrl, w: buildingW, h: buildingH }
            : null,
        },
      }
    })
  }, [hotspots, canvasSize.w, desktopCanvasWidth, fallbackHotspots])
}
