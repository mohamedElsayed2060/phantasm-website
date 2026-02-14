export function pctToWorld(pct, size) {
  return (Number(pct || 0) / 100) * Number(size || 0)
}

/**
 * Mirrors BuildingsLayer positioning:
 * - hotspot x/y = "foot point" in world coords
 * - building has w/h and anchor (x/y in % of sprite)
 * - resulting building top-left = foot - (w*anchorX/100, h*anchorY/100)
 */
export function computeBuildingRect(spot, canvasSize) {
  if (!spot || !canvasSize?.w || !canvasSize?.h) return null

  const footX = pctToWorld(spot.x, canvasSize.w)
  const footY = pctToWorld(spot.y, canvasSize.h)

  const building = spot?.building
  const anchor = building?.anchor || { x: 50, y: 92 }

  // Prefer the actual asset dimensions that layer uses (loop > spawn),
  // fallback to CMS flat fields (buildingW/H), then defaults.
  const sizeAsset = building?.loop || building?.spawn
  const w = Number(sizeAsset?.w ?? spot?.buildingW ?? 220)
  const h = Number(sizeAsset?.h ?? spot?.buildingH ?? 220)

  const ax = Number(anchor?.x ?? spot?.anchorX ?? 50)
  const ay = Number(anchor?.y ?? spot?.anchorY ?? 92)

  const x = footX - (w * ax) / 100
  const y = footY - (h * ay) / 100

  return { x, y, w, h, footX, footY }
}

/**
 * Anchor used by IntroBubble (and later Projects List):
 * choose a point that's visually centered on the building sprite,
 * not the hotspot foot point.
 */
export function computeIntroAnchorWorld(spot, canvasSize) {
  const rect = computeBuildingRect(spot, canvasSize)
  if (!rect) {
    return {
      worldX: pctToWorld(spot?.x, canvasSize?.w),
      worldY: pctToWorld(spot?.y, canvasSize?.h),
    }
  }

  // Center X on building
  const worldX = rect.x + rect.w / 2
  // Y = building foot (original hotspot point)
  const worldY = rect.footY

  return { worldX, worldY }
}
