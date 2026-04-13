import { BASE_MAP_WIDTH, BASE_MAP_HEIGHT, MIN_ZOOM_MULT } from './constants'

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getMapSize() {
  return {
    w: BASE_MAP_WIDTH,
    h: BASE_MAP_HEIGHT,
  }
}

export function getCoverScale(viewport, mapSize = getMapSize()) {
  const vw = Number(viewport?.w || 0)
  const vh = Number(viewport?.h || 0)
  const mw = Number(mapSize?.w || BASE_MAP_WIDTH)
  const mh = Number(mapSize?.h || BASE_MAP_HEIGHT)

  if (!vw || !vh || !mw || !mh) return 1

  return Math.max(vw / mw, vh / mh)
}

export function getMinScale(viewport, mapSize = getMapSize()) {
  return getCoverScale(viewport, mapSize) * MIN_ZOOM_MULT
}

export function getMaxScale(viewport, maxZoomMult = 2.5, mapSize = getMapSize()) {
  return getCoverScale(viewport, mapSize) * Number(maxZoomMult || 2.5)
}

export function getScaledMapSize(scale, mapSize = getMapSize()) {
  return {
    w: mapSize.w * scale,
    h: mapSize.h * scale,
  }
}

export function clampCamera(camera, viewport, scaledMap) {
  const vw = Number(viewport?.w || 0)
  const vh = Number(viewport?.h || 0)
  const sw = Number(scaledMap?.w || 0)
  const sh = Number(scaledMap?.h || 0)

  if (!vw || !vh || !sw || !sh) {
    return { x: 0, y: 0 }
  }

  const minX = Math.min(0, vw - sw)
  const maxX = 0
  const minY = Math.min(0, vh - sh)
  const maxY = 0

  return {
    x: clamp(Number(camera?.x || 0), minX, maxX),
    y: clamp(Number(camera?.y || 0), minY, maxY),
  }
}

export function getCenteredCamera(viewport, scaledMap) {
  const vw = Number(viewport?.w || 0)
  const vh = Number(viewport?.h || 0)
  const sw = Number(scaledMap?.w || 0)
  const sh = Number(scaledMap?.h || 0)

  return {
    x: (vw - sw) / 2,
    y: (vh - sh) / 2,
  }
}

export function worldToScreen(world, camera, scale) {
  return {
    x: Number(world?.x || 0) * scale + Number(camera?.x || 0),
    y: Number(world?.y || 0) * scale + Number(camera?.y || 0),
  }
}

export function screenToWorld(screen, camera, scale) {
  const safeScale = Number(scale || 1) || 1

  return {
    x: (Number(screen?.x || 0) - Number(camera?.x || 0)) / safeScale,
    y: (Number(screen?.y || 0) - Number(camera?.y || 0)) / safeScale,
  }
}

export function getCameraForZoomAtPoint({
  viewport,
  currentCamera,
  currentScale,
  nextScale,
  anchor,
  mapSize = getMapSize(),
}) {
  const worldPoint = screenToWorld(anchor, currentCamera, currentScale)

  const nextCamera = {
    x: Number(anchor?.x || 0) - worldPoint.x * nextScale,
    y: Number(anchor?.y || 0) - worldPoint.y * nextScale,
  }

  return clampCamera(nextCamera, viewport, getScaledMapSize(nextScale, mapSize))
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const numeric = Number(trimmed.replace('%', ''))
    if (Number.isFinite(numeric)) return numeric
  }

  return null
}

function isPercentString(value) {
  return typeof value === 'string' && value.trim().endsWith('%')
}

export function resolveLength(value, basis, unit) {
  const n = toNumber(value)
  if (n === null) return 0

  const normalizedUnit = typeof unit === 'string' ? unit.toLowerCase() : ''

  if (isPercentString(value) || normalizedUnit === 'percent' || normalizedUnit === '%') {
    return (n / 100) * basis
  }

  if (
    normalizedUnit === 'ratio' ||
    normalizedUnit === 'fraction' ||
    normalizedUnit === 'normalized'
  ) {
    return n * basis
  }

  return n
}

export function resolveAxis(value, axisSize) {
  const n = toNumber(value)
  if (n === null) return 0

  if (isPercentString(value)) {
    return (n / 100) * axisSize
  }

  if (n >= 0 && n <= 1) {
    return n * axisSize
  }

  if (n > 1 && n <= 100) {
    return (n / 100) * axisSize
  }

  return n
}

function pickFirstPair(hotspot) {
  const candidates = [
    { x: hotspot?.worldX, y: hotspot?.worldY, mode: 'world' },
    { x: hotspot?.mapX, y: hotspot?.mapY, mode: 'map' },
    { x: hotspot?.canvasX, y: hotspot?.canvasY, mode: 'canvas' },
    { x: hotspot?.x, y: hotspot?.y, mode: 'xy' },
    { x: hotspot?.left, y: hotspot?.top, mode: 'left-top' },

    { x: hotspot?.position?.x, y: hotspot?.position?.y, mode: 'position.xy' },
    { x: hotspot?.position?.left, y: hotspot?.position?.top, mode: 'position.left-top' },

    { x: hotspot?.coordinates?.x, y: hotspot?.coordinates?.y, mode: 'coordinates.xy' },
    { x: hotspot?.coordinates?.left, y: hotspot?.coordinates?.top, mode: 'coordinates.left-top' },

    { x: hotspot?.marker?.x, y: hotspot?.marker?.y, mode: 'marker.xy' },
    { x: hotspot?.marker?.left, y: hotspot?.marker?.top, mode: 'marker.left-top' },
  ]

  for (const candidate of candidates) {
    const x = toNumber(candidate?.x)
    const y = toNumber(candidate?.y)

    if (x !== null && y !== null) {
      return { x, y, mode: candidate.mode }
    }
  }

  return null
}

export function getHotspotWorldPoint(hotspot, mapSize = getMapSize()) {
  const raw = pickFirstPair(hotspot)

  if (!raw) {
    return {
      x: 0,
      y: 0,
      __debug: {
        mode: 'missing',
        rawX: null,
        rawY: null,
      },
    }
  }

  const x = resolveAxis(raw.x, mapSize.w)
  const y = resolveAxis(raw.y, mapSize.h)

  return {
    x,
    y,
    __debug: {
      mode: raw.mode,
      rawX: raw.x,
      rawY: raw.y,
    },
  }
}

export function getCameraForFocusPoint({
  viewport,
  scale,
  worldPoint,
  targetScreenPoint,
  mapSize = getMapSize(),
}) {
  const fallbackTarget = {
    x: Number(viewport?.w || 0) / 2,
    y: Number(viewport?.h || 0) / 2,
  }

  const target = targetScreenPoint || fallbackTarget

  const nextCamera = {
    x: target.x - Number(worldPoint?.x || 0) * scale,
    y: target.y - Number(worldPoint?.y || 0) * scale,
  }

  return clampCamera(nextCamera, viewport, getScaledMapSize(scale, mapSize))
}

export function canPan(viewport, scaledMap) {
  const vw = Number(viewport?.w || 0)
  const vh = Number(viewport?.h || 0)
  const sw = Number(scaledMap?.w || 0)
  const sh = Number(scaledMap?.h || 0)

  return sw > vw + 0.5 || sh > vh + 0.5
}

export function getHotspotLabel(hotspot, fallback = 'Hotspot') {
  return (
    hotspot?.label || hotspot?.title || hotspot?.name || hotspot?.slug || hotspot?.id || fallback
  )
}

export function resolveSpriteSize({
  width,
  height,
  widthUnit,
  heightUnit,
  fallbackWidth = 120,
  fallbackHeight = 120,
  mapSize = getMapSize(),
}) {
  const w = width != null ? resolveLength(width, mapSize.w, widthUnit) : fallbackWidth

  const h = height != null ? resolveLength(height, mapSize.h, heightUnit) : fallbackHeight

  return {
    w: Math.max(1, w || fallbackWidth),
    h: Math.max(1, h || fallbackHeight),
  }
}

export function getTravelPoint(item, mapSize = getMapSize()) {
  const start = getHotspotWorldPoint(
    {
      x: item?.startX ?? item?.fromX ?? item?.x,
      y: item?.startY ?? item?.fromY ?? item?.y,
    },
    mapSize,
  )

  const hasExplicitEnd =
    item?.endX != null || item?.endY != null || item?.toX != null || item?.toY != null

  if (hasExplicitEnd) {
    const end = getHotspotWorldPoint(
      {
        x: item?.endX ?? item?.toX ?? item?.x,
        y: item?.endY ?? item?.toY ?? item?.y,
      },
      mapSize,
    )

    return { start, end }
  }

  const travelX = resolveLength(
    item?.travelX ?? item?.dx ?? 0,
    mapSize.w,
    item?.travelXUnit || item?.dxUnit,
  )

  const travelY = resolveLength(
    item?.travelY ?? item?.dy ?? 0,
    mapSize.h,
    item?.travelYUnit || item?.dyUnit,
  )

  return {
    start,
    end: {
      x: start.x + travelX,
      y: start.y + travelY,
    },
  }
}
