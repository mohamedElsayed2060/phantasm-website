'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAX_ZOOM_MULT,
  DRAG_CLICK_THRESHOLD,
  INERTIA_FRICTION,
  INERTIA_STOP_EPSILON,
  MAX_VELOCITY,
  WHEEL_LINE_HEIGHT_PX,
} from './constants'
import {
  canPan,
  clamp,
  clampCamera,
  getCameraForFocusPoint,
  getCameraForZoomAtPoint,
  getCenteredCamera,
  getCoverScale,
  getHotspotLabel,
  getHotspotWorldPoint,
  getMaxScale,
  getScaledMapSize,
} from './helpers'
import { loadDiscoveredIds, saveDiscoveredIds } from './storage'
import HotspotsLayer from './layers/HotspotsLayer'
import BuildingsLayer from './layers/BuildingsLayer'
import DecorationsLayer from './layers/DecorationsLayer'
import AmbientLayer from './layers/AmbientLayer'
import IslandBootDock from '../Island-latest/overlays/IslandBootDock'
import ProjectsOverlay from '../Island-latest/overlays/ProjectsOverlay'
import { choosePlacementNoBottom, clampToViewportX } from '../Island-latest/utils'
import HomeDockOverlay from '@/components/overlays/HomeDockOverlay'
import { preloadMany } from '../Island-latest/preloadImage'

const WHEEL_ZOOM_STEP = 0.00032
const ZOOM_LERP = 0.08
const ZOOM_SETTLE_EPSILON = 0.0005
const FOCUS_LERP = 0.08

const PAN_VELOCITY_SMOOTHING = 0.22
const DRAG_SUPPRESS_MS = 260
const INTERACTIVE_DRAG_THRESHOLD = Math.max(DRAG_CLICK_THRESHOLD, 10)
const PINCH_MIN_DISTANCE = 8

const LS_PLAYER = 'phantasm:player'
const BOOT_DOCK_DISMISSED = 'phantasm:islandBootDockDismissed'

const POPOVER_W = 360
const POPOVER_H = 190
const POPOVER_MARGIN = 14
const POPOVER_GAP = 14

const FRAME_ASSETS = [
  '/frames/title-fram.png',
  '/frames/CardFrame.png',
  '/frames/imgFrame.png',
  '/frames/titleFrame.png',
  '/frames/dock-frame.png',
  '/frames/botton-frame.png',
]

function isInteractiveTarget(target) {
  if (!(target instanceof Element)) return false

  return Boolean(target.closest('[data-hotspot-button="true"], button, a, input, textarea, select'))
}

function toAbsoluteUrl(maybeRelative) {
  const s = String(maybeRelative || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (typeof window === 'undefined') return s
  if (s.startsWith('//')) return window.location.protocol + s
  if (s.startsWith('/')) return window.location.origin + s
  return window.location.origin + '/' + s
}

function readPlayerFromStorage() {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(LS_PLAYER)
    if (!raw) return null

    const data = JSON.parse(raw)
    return {
      id: data?.id || null,
      name: data?.name || 'Player',
      avatarSrc: data?.avatarImage ? toAbsoluteUrl(data.avatarImage) : '',
    }
  } catch {
    return null
  }
}

function isBootDockDismissed() {
  if (typeof window === 'undefined') return false

  try {
    return localStorage.getItem(BOOT_DOCK_DISMISSED) === '1'
  } catch {
    return false
  }
}

function worldToScreen({ worldX, worldY, state }) {
  return {
    sx: state.x + worldX * state.scale,
    sy: state.y + worldY * state.scale,
  }
}

function getPointerDistance(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

function getPointerCenter(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

export default function IslandCustomLab({ hotspots = [], scene, bootDock, homeDock }) {
  const viewportRef = useRef(null)
  const sceneRef = useRef(null)

  const inertiaRafRef = useRef(null)
  const zoomRafRef = useRef(null)
  const focusRafRef = useRef(null)
  const cameraFrameRafRef = useRef(null)

  const pointerIdRef = useRef(null)
  const didInitRef = useRef(false)
  const spawnTimerRef = useRef(null)
  const bootReadySentRef = useRef(false)
  const sceneReadySentRef = useRef(false)
  const suppressInteractiveClickUntilRef = useRef(0)
  const lastDragWasInteractiveRef = useRef(false)
  const activePointersRef = useRef(new Map())
  const pinchRef = useRef({
    active: false,
    startDistance: 0,
    startScale: 1,
    startCamera: { x: 0, y: 0 },
    startCenter: { x: 0, y: 0 },
  })
  const dragRef = useRef({
    active: false,
    captured: false,
    startedOnInteractive: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    moved: 0,
  })

  const velocityRef = useRef({ x: 0, y: 0 })
  const cameraRef = useRef({ x: 0, y: 0 })
  const currentScaleRef = useRef(1)
  const targetScaleRef = useRef(1)
  const zoomAnchorRef = useRef(null)
  const focusTargetRef = useRef(null)
  const hoveredHotspotIdRef = useRef(null)
  const overlayVisibleRef = useRef(false)

  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [mapSize, setMapSize] = useState({
    w: Number(scene?.backgroundW) || 0,
    h: Number(scene?.backgroundH) || 0,
    ready: false,
  })
  const [isReady, setIsReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [activeHotspotId, setActiveHotspotId] = useState(null)
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null)
  const [spawningId, setSpawningId] = useState(null)
  const [discoveredIds, setDiscoveredIds] = useState(() => loadDiscoveredIds())
  const [bootDockOpen, setBootDockOpen] = useState(false)
  const [openProjectsFor, setOpenProjectsFor] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [overlayPos, setOverlayPos] = useState(null)
  const [cameraFrame, setCameraFrame] = useState(0)
  const [player, setPlayer] = useState(() => {
    const stored = readPlayerFromStorage()
    return (
      stored || {
        id: null,
        name: 'Player',
        avatarSrc: '',
      }
    )
  })

  const maxZoomMult = Number(scene?.maxZoomMult || DEFAULT_MAX_ZOOM_MULT)
  const backgroundSrc = scene?.backgroundSrc || ''

  const orderedHotspots = useMemo(() => {
    return [...(Array.isArray(hotspots) ? hotspots : [])].sort(
      (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
    )
  }, [hotspots])

  const hoveredHotspot = useMemo(() => {
    if (!hoveredHotspotId) return null
    return orderedHotspots.find((spot) => String(spot?.id) === String(hoveredHotspotId)) || null
  }, [orderedHotspots, hoveredHotspotId])

  const baseScale = useMemo(() => getCoverScale(viewport, mapSize), [viewport, mapSize])
  const minScale = useMemo(() => baseScale, [baseScale])

  const maxScale = useMemo(() => {
    return Math.max(baseScale, getMaxScale(viewport, maxZoomMult, mapSize))
  }, [baseScale, mapSize, maxZoomMult, viewport])

  const pannable = useMemo(() => {
    return canPan(viewport, getScaledMapSize(currentScaleRef.current || baseScale, mapSize))
  }, [viewport, baseScale, mapSize, cameraFrame])

  const blockCanvasInput = Boolean(overlayPos || bootDockOpen)

  const overlayMeta = useMemo(() => {
    if (!openProjectsFor) return null

    const spot = orderedHotspots.find((h) => String(h?.id) === String(openProjectsFor))
    if (!spot || !mapSize.ready) return null

    const popW = Math.max(0, Math.min(POPOVER_W, viewport.w - 24))
    return { spot, popW, popH: POPOVER_H }
  }, [openProjectsFor, orderedHotspots, mapSize.ready, viewport.w])

  useEffect(() => {
    hoveredHotspotIdRef.current = hoveredHotspotId
  }, [hoveredHotspotId])

  useEffect(() => {
    overlayVisibleRef.current = Boolean(overlayMeta || hoveredHotspotId)
  }, [overlayMeta, hoveredHotspotId])

  const scheduleCameraFrame = useCallback(() => {
    if (!overlayVisibleRef.current) return
    if (cameraFrameRafRef.current) return

    cameraFrameRafRef.current = window.requestAnimationFrame(() => {
      cameraFrameRafRef.current = null
      setCameraFrame((prev) => prev + 1)
    })
  }, [])

  const updateSceneTransform = useCallback(() => {
    const node = sceneRef.current
    if (!node) return

    node.style.width = `${mapSize.w}px`
    node.style.height = `${mapSize.h}px`
    node.style.transform = `translate3d(${cameraRef.current.x}px, ${cameraRef.current.y}px, 0) scale(${currentScaleRef.current})`
    node.style.transformOrigin = '0 0'

    scheduleCameraFrame()
  }, [mapSize.h, mapSize.w, scheduleCameraFrame])

  useEffect(() => {
    if (!overlayMeta || !viewport.w || !viewport.h || !mapSize.ready) {
      setOverlayPos(null)
      return
    }

    const { spot, popW, popH } = overlayMeta
    const currentTransform = {
      x: cameraRef.current.x,
      y: cameraRef.current.y,
      scale: currentScaleRef.current,
    }

    const point = getHotspotWorldPoint(spot, mapSize)

    const bw = Number(spot?.buildingW || 240)
    const bh = Number(spot?.buildingH || 240)
    const ax = Number(spot?.anchorX ?? 0.5)
    const ay = Number(spot?.anchorY ?? 0.9)

    const buildingWorldLeft = point.x - ax * bw
    const buildingWorldTop = point.y - ay * bh
    const buildingWorldRight = buildingWorldLeft + bw
    const buildingWorldBottom = buildingWorldTop + bh

    const tl = worldToScreen({
      worldX: buildingWorldLeft,
      worldY: buildingWorldTop,
      state: currentTransform,
    })
    const br = worldToScreen({
      worldX: buildingWorldRight,
      worldY: buildingWorldBottom,
      state: currentTransform,
    })

    const buildingScreen = {
      left: tl.sx,
      top: tl.sy,
      right: br.sx,
      bottom: br.sy,
      cx: (tl.sx + br.sx) / 2,
      cy: (tl.sy + br.sy) / 2,
    }

    const placement = choosePlacementNoBottom({
      viewportW: viewport.w,
      viewportH: viewport.h,
      buildingScreen,
      popoverW: popW,
      popoverH: popH,
      margin: POPOVER_MARGIN,
      gap: POPOVER_GAP,
    })

    let left = buildingScreen.cx
    let top = buildingScreen.top - POPOVER_GAP

    if (placement === 'top') {
      left = clampToViewportX(buildingScreen.cx, viewport.w, popW, POPOVER_MARGIN)
      top = buildingScreen.top - POPOVER_GAP
    }

    if (placement === 'right') {
      left = buildingScreen.right + POPOVER_GAP
      top = buildingScreen.cy
    }

    if (placement === 'left') {
      left = buildingScreen.left - POPOVER_GAP
      top = buildingScreen.cy
    }

    setOverlayPos({ ...overlayMeta, placement, left, top, buildingScreen })
  }, [overlayMeta, viewport.w, viewport.h, mapSize.ready, mapSize.w, mapSize.h, cameraFrame])

  useEffect(() => {
    saveDiscoveredIds(discoveredIds)
  }, [discoveredIds])

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current) {
      window.cancelAnimationFrame(inertiaRafRef.current)
      inertiaRafRef.current = null
    }
    velocityRef.current = { x: 0, y: 0 }
  }, [])

  const stopZoomAnimation = useCallback(() => {
    if (zoomRafRef.current) {
      window.cancelAnimationFrame(zoomRafRef.current)
      zoomRafRef.current = null
    }
    zoomAnchorRef.current = null
  }, [])

  const stopFocusAnimation = useCallback(() => {
    if (focusRafRef.current) {
      window.cancelAnimationFrame(focusRafRef.current)
      focusRafRef.current = null
    }
    focusTargetRef.current = null
  }, [])

  const stopAllMotion = useCallback(() => {
    stopInertia()
    stopZoomAnimation()
    stopFocusAnimation()
  }, [stopFocusAnimation, stopInertia, stopZoomAnimation])

  const resetDiscoveryState = useCallback(() => {
    if (spawnTimerRef.current) {
      window.clearTimeout(spawnTimerRef.current)
      spawnTimerRef.current = null
    }

    setDiscoveredIds(loadDiscoveredIds())
    setSpawningId(null)
    setActiveHotspotId(null)
    setHoveredHotspotId(null)
    setOpenProjectsFor(null)
    setActiveProject(null)
    setDialogOpen(false)
    setDetailsOpen(false)
    setOverlayPos(null)
  }, [])

  useEffect(() => {
    const syncDiscoveredFromStorage = () => {
      resetDiscoveryState()
    }

    syncDiscoveredFromStorage()

    window.addEventListener('storage', syncDiscoveredFromStorage)
    window.addEventListener('phantasm:playerSelected', syncDiscoveredFromStorage)

    return () => {
      window.removeEventListener('storage', syncDiscoveredFromStorage)
      window.removeEventListener('phantasm:playerSelected', syncDiscoveredFromStorage)
    }
  }, [resetDiscoveryState])

  useEffect(() => {
    const syncPlayer = () => {
      const stored = readPlayerFromStorage()

      setPlayer(
        stored || {
          id: null,
          name: 'Player',
          avatarSrc: '',
        },
      )
    }

    syncPlayer()

    window.addEventListener('storage', syncPlayer)
    window.addEventListener('phantasm:playerSelected', syncPlayer)

    return () => {
      window.removeEventListener('storage', syncPlayer)
      window.removeEventListener('phantasm:playerSelected', syncPlayer)
    }
  }, [])

  useEffect(() => {
    if (!backgroundSrc) return

    let cancelled = false
    const img = new Image()
    img.src = backgroundSrc

    img.onload = () => {
      if (cancelled) return

      setMapSize({
        w: img.naturalWidth,
        h: img.naturalHeight,
        ready: true,
      })
    }

    img.onerror = () => {
      if (cancelled) return
      setMapSize((prev) => ({
        w: Number(scene?.backgroundW) || prev.w,
        h: Number(scene?.backgroundH) || prev.h,
        ready: true,
      }))
    }

    return () => {
      cancelled = true
    }
  }, [backgroundSrc, scene?.backgroundH, scene?.backgroundW])

  useEffect(() => {
    if (!mapSize.ready || !viewport.w || !viewport.h) return
    if (!bootDock?.enabled) return
    if (!player?.avatarSrc) return

    const pagesLen = Array.isArray(bootDock?.pages) ? bootDock.pages.length : 0
    if (!pagesLen) return
    if (isBootDockDismissed()) return

    setBootDockOpen(true)
  }, [
    mapSize.ready,
    viewport.w,
    viewport.h,
    player?.avatarSrc,
    bootDock?.enabled,
    bootDock?.pages?.length,
  ])

  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'bootDock', locked: Boolean(bootDockOpen) },
        }),
      )
    } catch {}

    return () => {
      try {
        window.dispatchEvent(
          new CustomEvent('phantasm:overlayLock', {
            detail: { key: 'bootDock', locked: false },
          }),
        )
      } catch {}
    }
  }, [bootDockOpen])

  const closeBootDock = useCallback(() => {
    setBootDockOpen(false)

    try {
      localStorage.setItem(BOOT_DOCK_DISMISSED, '1')
    } catch {}
  }, [])

  const applyImmediateZoom = useCallback(
    (nextScale, anchor, baseCamera = cameraRef.current, baseScale = currentScaleRef.current) => {
      const safeScale = clamp(nextScale, minScale, maxScale)
      const nextCamera = getCameraForZoomAtPoint({
        viewport,
        currentCamera: baseCamera,
        currentScale: baseScale,
        nextScale: safeScale,
        anchor,
        mapSize,
      })

      currentScaleRef.current = safeScale
      targetScaleRef.current = safeScale
      cameraRef.current = nextCamera

      updateSceneTransform()
    },
    [mapSize, maxScale, minScale, updateSceneTransform, viewport],
  )

  const animateZoomTo = useCallback(
    (nextScale, anchor) => {
      const safeTarget = clamp(nextScale, minScale, maxScale)
      targetScaleRef.current = safeTarget
      zoomAnchorRef.current = anchor || { x: viewport.w / 2, y: viewport.h / 2 }

      if (zoomRafRef.current) return

      const tick = () => {
        const currentScale = currentScaleRef.current
        const targetScale = targetScaleRef.current

        const delta = targetScale - currentScale
        const next =
          Math.abs(delta) <= ZOOM_SETTLE_EPSILON ? targetScale : currentScale + delta * ZOOM_LERP

        const nextCamera = getCameraForZoomAtPoint({
          viewport,
          currentCamera: cameraRef.current,
          currentScale,
          nextScale: next,
          anchor: zoomAnchorRef.current || { x: viewport.w / 2, y: viewport.h / 2 },
          mapSize,
        })

        currentScaleRef.current = next
        cameraRef.current = nextCamera

        updateSceneTransform()

        if (Math.abs(targetScale - next) <= ZOOM_SETTLE_EPSILON) {
          currentScaleRef.current = targetScale
          cameraRef.current = getCameraForZoomAtPoint({
            viewport,
            currentCamera: cameraRef.current,
            currentScale: next,
            nextScale: targetScale,
            anchor: zoomAnchorRef.current || { x: viewport.w / 2, y: viewport.h / 2 },
            mapSize,
          })
          updateSceneTransform()
          zoomRafRef.current = null
          zoomAnchorRef.current = null
          return
        }

        zoomRafRef.current = window.requestAnimationFrame(tick)
      }

      zoomRafRef.current = window.requestAnimationFrame(tick)
    },
    [mapSize, maxScale, minScale, updateSceneTransform, viewport],
  )

  const animateFocusTo = useCallback(
    ({ worldPoint, nextScale, targetScreenPoint, onComplete }) => {
      stopZoomAnimation()
      stopFocusAnimation()

      const safeScale = clamp(nextScale, minScale, maxScale)
      targetScaleRef.current = safeScale

      const nextCamera = getCameraForFocusPoint({
        viewport,
        scale: safeScale,
        worldPoint,
        targetScreenPoint: targetScreenPoint || {
          x: viewport.w / 2,
          y: viewport.h * 0.62,
        },
        mapSize,
      })

      focusTargetRef.current = {
        cameraX: nextCamera.x,
        cameraY: nextCamera.y,
        scale: safeScale,
        onComplete,
      }

      const tick = () => {
        const target = focusTargetRef.current
        if (!target) return

        const nextCameraX =
          cameraRef.current.x + (target.cameraX - cameraRef.current.x) * FOCUS_LERP
        const nextCameraY =
          cameraRef.current.y + (target.cameraY - cameraRef.current.y) * FOCUS_LERP
        const nextScaleValue =
          currentScaleRef.current + (target.scale - currentScaleRef.current) * FOCUS_LERP

        const settled =
          Math.abs(target.cameraX - nextCameraX) <= 0.5 &&
          Math.abs(target.cameraY - nextCameraY) <= 0.5 &&
          Math.abs(target.scale - nextScaleValue) <= ZOOM_SETTLE_EPSILON

        cameraRef.current = settled
          ? { x: target.cameraX, y: target.cameraY }
          : { x: nextCameraX, y: nextCameraY }

        currentScaleRef.current = settled ? target.scale : nextScaleValue

        updateSceneTransform()

        if (settled) {
          const done = target.onComplete
          focusTargetRef.current = null
          focusRafRef.current = null
          done?.()
          return
        }

        focusRafRef.current = window.requestAnimationFrame(tick)
      }

      focusRafRef.current = window.requestAnimationFrame(tick)
    },
    [
      mapSize,
      maxScale,
      minScale,
      stopFocusAnimation,
      stopZoomAnimation,
      updateSceneTransform,
      viewport,
    ],
  )

  const animateResetToHome = useCallback(() => {
    stopZoomAnimation()
    stopFocusAnimation()

    const targetScale = baseScale
    const targetCamera = getCenteredCamera(viewport, getScaledMapSize(targetScale, mapSize))

    focusTargetRef.current = {
      cameraX: targetCamera.x,
      cameraY: targetCamera.y,
      scale: targetScale,
      onComplete: null,
    }

    const tick = () => {
      const target = focusTargetRef.current
      if (!target) return

      const nextCameraX = cameraRef.current.x + (target.cameraX - cameraRef.current.x) * FOCUS_LERP
      const nextCameraY = cameraRef.current.y + (target.cameraY - cameraRef.current.y) * FOCUS_LERP
      const nextScaleValue =
        currentScaleRef.current + (target.scale - currentScaleRef.current) * FOCUS_LERP

      const settled =
        Math.abs(target.cameraX - nextCameraX) <= 0.5 &&
        Math.abs(target.cameraY - nextCameraY) <= 0.5 &&
        Math.abs(target.scale - nextScaleValue) <= ZOOM_SETTLE_EPSILON

      cameraRef.current = settled
        ? { x: target.cameraX, y: targetCamera.y }
        : { x: nextCameraX, y: nextCameraY }

      currentScaleRef.current = settled ? target.scale : nextScaleValue

      updateSceneTransform()

      if (settled) {
        focusTargetRef.current = null
        focusRafRef.current = null
        return
      }

      focusRafRef.current = window.requestAnimationFrame(tick)
    }

    focusRafRef.current = window.requestAnimationFrame(tick)
  }, [baseScale, mapSize, stopFocusAnimation, stopZoomAnimation, updateSceneTransform, viewport])

  const startInertia = useCallback(() => {
    stopInertia()

    let lastTs = performance.now()

    const tick = (ts) => {
      const dt = Math.max(8, Math.min(32, ts - lastTs))
      lastTs = ts

      const damping = Math.pow(INERTIA_FRICTION, dt / 16.6667)
      const nextVelocity = {
        x: velocityRef.current.x * damping,
        y: velocityRef.current.y * damping,
      }

      if (
        Math.abs(nextVelocity.x) < INERTIA_STOP_EPSILON &&
        Math.abs(nextVelocity.y) < INERTIA_STOP_EPSILON
      ) {
        velocityRef.current = { x: 0, y: 0 }
        inertiaRafRef.current = null
        return
      }

      velocityRef.current = nextVelocity

      cameraRef.current = clampCamera(
        {
          x: cameraRef.current.x + nextVelocity.x * dt,
          y: cameraRef.current.y + nextVelocity.y * dt,
        },
        viewport,
        getScaledMapSize(currentScaleRef.current, mapSize),
      )

      updateSceneTransform()

      inertiaRafRef.current = window.requestAnimationFrame(tick)
    }

    inertiaRafRef.current = window.requestAnimationFrame(tick)
  }, [mapSize, stopInertia, updateSceneTransform, viewport])

  const normalizeWheelDelta = useCallback((e) => {
    if (e.deltaMode === 1) return e.deltaY * WHEEL_LINE_HEIGHT_PX
    if (e.deltaMode === 2) return e.deltaY * window.innerHeight
    return e.deltaY
  }, [])

  const beginPinchIfPossible = useCallback(() => {
    const points = Array.from(activePointersRef.current.values())
    if (points.length < 2) return false

    const a = points[0]
    const b = points[1]
    const startDistance = getPointerDistance(a, b)

    if (startDistance < PINCH_MIN_DISTANCE) return false

    pinchRef.current = {
      active: true,
      startDistance,
      startScale: currentScaleRef.current,
      startCamera: { ...cameraRef.current },
      startCenter: getPointerCenter(a, b),
    }

    dragRef.current.active = false
    pointerIdRef.current = null
    setDragging(false)

    stopAllMotion()
    return true
  }, [stopAllMotion])

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const measure = () => {
      const rect = node.getBoundingClientRect()
      setViewport({
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      })
    }

    measure()

    const ro = new ResizeObserver(() => {
      measure()
    })

    ro.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (!viewport.w || !viewport.h) return
    if (!mapSize.w || !mapSize.h) return
    if (!mapSize.ready) return

    const nextScaledMap = getScaledMapSize(baseScale, mapSize)

    currentScaleRef.current = clamp(currentScaleRef.current || baseScale, baseScale, maxScale)
    targetScaleRef.current = clamp(targetScaleRef.current || baseScale, baseScale, maxScale)

    if (!didInitRef.current) {
      cameraRef.current = getCenteredCamera(viewport, nextScaledMap)
      currentScaleRef.current = baseScale
      targetScaleRef.current = baseScale
      didInitRef.current = true
    } else {
      cameraRef.current = clampCamera(
        cameraRef.current,
        viewport,
        getScaledMapSize(currentScaleRef.current, mapSize),
      )
    }

    updateSceneTransform()
    setIsReady(true)
  }, [baseScale, mapSize, maxScale, viewport, updateSceneTransform])

  useEffect(() => {
    if (!isReady) return
    if (!mapSize.ready || !viewport.w || !viewport.h) return
    if (bootReadySentRef.current) return

    bootReadySentRef.current = true

    try {
      sessionStorage.setItem('phantasm:bootReady', '1')
      window.dispatchEvent(new CustomEvent('phantasm:bootReady'))
    } catch {}
  }, [isReady, mapSize.ready, viewport.w, viewport.h])

  useEffect(() => {
    if (!isReady) return
    if (!mapSize.ready || !viewport.w || !viewport.h) return
    if (!backgroundSrc) return
    if (sceneReadySentRef.current) return

    let cancelled = false

    const discoveredLoops = orderedHotspots
      .filter((hotspot) => discoveredIds.has(String(hotspot?.id)))
      .map((hotspot) => hotspot?.buildingLoopSrc)
      .filter(Boolean)

    const criticalUrls = [backgroundSrc, ...discoveredLoops].filter(Boolean)

    const secondaryUrls = [
      ...FRAME_ASSETS,
      ...orderedHotspots.map((hotspot) => hotspot?.hotspotIdleSrc).filter(Boolean),
      ...(scene?.decorations || []).map((item) => item?.src).filter(Boolean),
      ...(scene?.ambient || []).map((item) => item?.src).filter(Boolean),
    ].filter(Boolean)

    preloadMany(criticalUrls).finally(() => {
      if (cancelled) return

      sceneReadySentRef.current = true

      try {
        sessionStorage.setItem('phantasm:sceneReady', '1')
        window.dispatchEvent(new CustomEvent('phantasm:sceneReady'))
      } catch {}

      const runSecondary = () => preloadMany(secondaryUrls)

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(runSecondary, { timeout: 1500 })
      } else {
        window.setTimeout(runSecondary, 250)
      }
    })

    return () => {
      cancelled = true
    }
  }, [
    isReady,
    mapSize.ready,
    viewport.w,
    viewport.h,
    backgroundSrc,
    orderedHotspots,
    discoveredIds,
    scene?.decorations,
    scene?.ambient,
  ])

  useEffect(() => {
    if (!viewport.w || !viewport.h) return
    if (!mapSize.w || !mapSize.h) return
    if (!mapSize.ready) return
    if (!didInitRef.current) return

    currentScaleRef.current = clamp(currentScaleRef.current, baseScale, maxScale)
    targetScaleRef.current = clamp(targetScaleRef.current, baseScale, maxScale)
    cameraRef.current = clampCamera(
      cameraRef.current,
      viewport,
      getScaledMapSize(currentScaleRef.current, mapSize),
    )

    updateSceneTransform()
  }, [baseScale, mapSize, maxScale, updateSceneTransform, viewport])

  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current)
      if (inertiaRafRef.current) window.cancelAnimationFrame(inertiaRafRef.current)
      if (zoomRafRef.current) window.cancelAnimationFrame(zoomRafRef.current)
      if (focusRafRef.current) window.cancelAnimationFrame(focusRafRef.current)
      if (cameraFrameRafRef.current) window.cancelAnimationFrame(cameraFrameRafRef.current)
    }
  }, [])

  useEffect(() => {
    bootReadySentRef.current = false
    sceneReadySentRef.current = false

    try {
      sessionStorage.removeItem('phantasm:bootReady')
      sessionStorage.removeItem('phantasm:sceneReady')
    } catch {}
  }, [backgroundSrc])

  const handleWheel = useCallback(
    (e) => {
      if (!viewportRef.current) return
      if (!viewport.w || !viewport.h) return
      if (blockCanvasInput) return

      e.preventDefault()

      const rect = viewportRef.current.getBoundingClientRect()
      const anchor = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      const normalizedDelta = normalizeWheelDelta(e)
      const scaleBase = zoomRafRef.current ? targetScaleRef.current : currentScaleRef.current
      const nextScale = scaleBase * Math.exp(-normalizedDelta * WHEEL_ZOOM_STEP)

      stopInertia()
      stopFocusAnimation()
      animateZoomTo(nextScale, anchor)
    },
    [
      animateZoomTo,
      blockCanvasInput,
      normalizeWheelDelta,
      stopFocusAnimation,
      stopInertia,
      viewport.h,
      viewport.w,
    ],
  )

  const handlePointerDownCapture = useCallback(
    (e) => {
      if (!viewportRef.current) return
      if (blockCanvasInput) return
      if (e.pointerType === 'mouse' && e.button !== 0) return

      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (activePointersRef.current.size >= 2) {
        beginPinchIfPossible()
        return
      }

      stopAllMotion()

      const startedOnInteractive = isInteractiveTarget(e.target)

      pointerIdRef.current = e.pointerId
      lastDragWasInteractiveRef.current = startedOnInteractive

      dragRef.current = {
        active: true,
        captured: false,
        startedOnInteractive,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        moved: 0,
      }

      setDragging(false)

      // مهم:
      // ما نخطفش الـ pointer من الزر لو البداية كانت على hotspot/building
      if (!startedOnInteractive) {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dragRef.current.captured = true
      }
    },
    [beginPinchIfPossible, blockCanvasInput, stopAllMotion],
  )
  const handlePointerMoveCapture = useCallback(
    (e) => {
      const currentPoint = activePointersRef.current.get(e.pointerId)
      if (currentPoint) {
        currentPoint.x = e.clientX
        currentPoint.y = e.clientY
      }

      if (pinchRef.current.active) {
        const points = Array.from(activePointersRef.current.values())
        if (points.length < 2) return

        const a = points[0]
        const b = points[1]
        const distance = getPointerDistance(a, b)

        if (distance < PINCH_MIN_DISTANCE) return

        const center = getPointerCenter(a, b)
        const pinch = pinchRef.current
        const scaleRatio = distance / pinch.startDistance
        const nextScale = clamp(pinch.startScale * scaleRatio, minScale, maxScale)

        let nextCamera = getCameraForZoomAtPoint({
          viewport,
          currentCamera: pinch.startCamera,
          currentScale: pinch.startScale,
          nextScale,
          anchor: pinch.startCenter,
          mapSize,
        })

        nextCamera = clampCamera(
          {
            x: nextCamera.x + (center.x - pinch.startCenter.x),
            y: nextCamera.y + (center.y - pinch.startCenter.y),
          },
          viewport,
          getScaledMapSize(nextScale, mapSize),
        )

        currentScaleRef.current = nextScale
        targetScaleRef.current = nextScale
        cameraRef.current = nextCamera
        velocityRef.current = { x: 0, y: 0 }

        updateSceneTransform()
        return
      }

      if (!dragRef.current.active) return
      if (pointerIdRef.current !== e.pointerId) return

      const moveDx = e.clientX - dragRef.current.startX
      const moveDy = e.clientY - dragRef.current.startY
      const moved = Math.max(Math.abs(moveDx), Math.abs(moveDy))

      dragRef.current.moved = Math.max(dragRef.current.moved, moved)

      const threshold = dragRef.current.startedOnInteractive
        ? INTERACTIVE_DRAG_THRESHOLD
        : DRAG_CLICK_THRESHOLD

      // لو البداية كانت على عنصر interactive، ما نبدأش drag فعلي إلا بعد threshold
      if (dragRef.current.startedOnInteractive && moved <= threshold) {
        return
      }

      // أول ما نتأكد إنه drag حقيقي، ساعتها فقط نخطف الـ pointer
      if (!dragRef.current.captured) {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dragRef.current.captured = true
      }

      const frameDx = e.clientX - dragRef.current.lastX
      const frameDy = e.clientY - dragRef.current.lastY

      if (dragRef.current.moved > threshold && !dragging) {
        setDragging(true)
      }

      const nextCamera = clampCamera(
        {
          x: cameraRef.current.x + frameDx,
          y: cameraRef.current.y + frameDy,
        },
        viewport,
        getScaledMapSize(currentScaleRef.current, mapSize),
      )

      cameraRef.current = nextCamera
      updateSceneTransform()

      const now = performance.now()
      const dt = Math.max(1, now - dragRef.current.lastTime)

      const rawVx = frameDx / dt
      const rawVy = frameDy / dt

      velocityRef.current = {
        x:
          velocityRef.current.x +
          (Math.sign(rawVx) * Math.min(Math.abs(rawVx), MAX_VELOCITY) - velocityRef.current.x) *
            PAN_VELOCITY_SMOOTHING,
        y:
          velocityRef.current.y +
          (Math.sign(rawVy) * Math.min(Math.abs(rawVy), MAX_VELOCITY) - velocityRef.current.y) *
            PAN_VELOCITY_SMOOTHING,
      }

      dragRef.current.lastX = e.clientX
      dragRef.current.lastY = e.clientY
      dragRef.current.lastTime = now
    },
    [dragging, mapSize, maxScale, minScale, updateSceneTransform, viewport],
  )

  const finishPointerGesture = useCallback(
    (e) => {
      activePointersRef.current.delete(e.pointerId)

      if (pinchRef.current.active) {
        if (activePointersRef.current.size < 2) {
          pinchRef.current.active = false
          suppressInteractiveClickUntilRef.current = performance.now() + DRAG_SUPPRESS_MS
        }

        if (dragRef.current.captured) {
          try {
            e.currentTarget.releasePointerCapture?.(e.pointerId)
          } catch {}
        }

        dragRef.current.captured = false
        return
      }

      if (!dragRef.current.active) {
        if (dragRef.current.captured) {
          try {
            e.currentTarget.releasePointerCapture?.(e.pointerId)
          } catch {}
        }

        dragRef.current.captured = false
        return
      }

      if (pointerIdRef.current !== e.pointerId) {
        if (dragRef.current.captured) {
          try {
            e.currentTarget.releasePointerCapture?.(e.pointerId)
          } catch {}
        }

        dragRef.current.captured = false
        return
      }

      const moved = dragRef.current.moved
      const threshold = dragRef.current.startedOnInteractive
        ? INTERACTIVE_DRAG_THRESHOLD
        : DRAG_CLICK_THRESHOLD

      dragRef.current.active = false
      pointerIdRef.current = null
      setDragging(false)

      if (dragRef.current.captured) {
        try {
          e.currentTarget.releasePointerCapture?.(e.pointerId)
        } catch {}
      }

      dragRef.current.captured = false

      if (moved > threshold) {
        suppressInteractiveClickUntilRef.current = performance.now() + DRAG_SUPPRESS_MS
        startInertia()
      } else {
        velocityRef.current = { x: 0, y: 0 }
      }
    },
    [startInertia],
  )

  const handleClickCapture = useCallback((e) => {
    if (performance.now() < suppressInteractiveClickUntilRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [])

  const finishDiscovery = useCallback((hotspot) => {
    const sid = String(hotspot?.id)

    setDiscoveredIds((prev) => {
      const next = new Set(prev)
      next.add(sid)
      return next
    })

    setSpawningId(null)
    setActiveHotspotId(sid)
    setOpenProjectsFor(sid)
    setActiveProject(null)
    setDetailsOpen(false)
    setDialogOpen(true)
  }, [])

  const beginSpawnSequence = useCallback(
    (hotspot) => {
      if (spawnTimerRef.current) {
        window.clearTimeout(spawnTimerRef.current)
      }

      setSpawningId(String(hotspot?.id))
      setOpenProjectsFor(null)
      setActiveProject(null)
      setDetailsOpen(false)
      setDialogOpen(false)

      const spawnMs = Number(hotspot?.spawnDurationMs ?? 1700)

      spawnTimerRef.current = window.setTimeout(() => {
        finishDiscovery(hotspot)
      }, spawnMs)
    },
    [finishDiscovery],
  )

  const handleHotspotClick = useCallback(
    (hotspot) => {
      const sid = String(hotspot?.id)
      const alreadyDiscovered = discoveredIds.has(sid)

      closeBootDock()
      setHoveredHotspotId(null)
      setActiveHotspotId(sid)

      const worldPoint = getHotspotWorldPoint(hotspot, mapSize)
      const targetScale = clamp(minScale * 1.5, minScale, maxScale)

      if (alreadyDiscovered) {
        setActiveProject(null)
        setDetailsOpen(false)

        animateFocusTo({
          worldPoint,
          nextScale: targetScale,
          onComplete: () => {
            setOpenProjectsFor(sid)
            setDialogOpen(true)
          },
        })

        return
      }

      animateFocusTo({
        worldPoint,
        nextScale: targetScale,
        onComplete: () => {
          beginSpawnSequence(hotspot)
        },
      })
    },
    [animateFocusTo, beginSpawnSequence, closeBootDock, discoveredIds, mapSize, maxScale, minScale],
  )

  const handleBuiltBuildingClick = useCallback(
    (hotspot) => {
      const sid = String(hotspot?.id)

      closeBootDock()
      setHoveredHotspotId(null)
      setActiveHotspotId(sid)
      setOpenProjectsFor(null)
      setActiveProject(null)
      setDetailsOpen(false)
      setDialogOpen(false)

      const worldPoint = getHotspotWorldPoint(hotspot, mapSize)
      const targetScale = clamp(minScale * 1.5, minScale, maxScale)

      animateFocusTo({
        worldPoint,
        nextScale: targetScale,
        onComplete: () => {
          setOpenProjectsFor(sid)
          setDialogOpen(true)
        },
      })
    },
    [animateFocusTo, closeBootDock, mapSize, maxScale, minScale],
  )

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const onWheel = (e) => handleWheel(e)
    node.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      node.removeEventListener('wheel', onWheel)
    }
  }, [handleWheel])

  if (!backgroundSrc) {
    return (
      <main className="fixed inset-0 overflow-hidden bg-black text-white">
        <div className="flex h-full w-full items-center justify-center text-sm text-white/70">
          Missing island background
        </div>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-hidden"
        onPointerDownCapture={handlePointerDownCapture}
        onPointerMoveCapture={handlePointerMoveCapture}
        onPointerUpCapture={finishPointerGesture}
        onPointerCancelCapture={finishPointerGesture}
        onLostPointerCapture={finishPointerGesture}
        onClickCapture={handleClickCapture}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: blockCanvasInput
            ? 'default'
            : pannable
              ? dragging
                ? 'grabbing'
                : 'grab'
              : 'default',
        }}
      >
        <div
          ref={sceneRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{
            width: `${mapSize.w}px`,
            height: `${mapSize.h}px`,
            transform: 'translate3d(0,0,0) scale(1)',
            transformOrigin: '0 0',
            visibility: mapSize.ready && isReady ? 'visible' : 'hidden',
          }}
        >
          <img
            src={backgroundSrc}
            alt="Island scene"
            className="pointer-events-none block h-full w-full select-none object-cover"
            draggable={false}
          />

          <DecorationsLayer items={scene?.decorations || []} mapSize={mapSize} />

          <BuildingsLayer
            hotspots={orderedHotspots}
            mapSize={mapSize}
            discoveredIds={discoveredIds}
            spawningId={spawningId}
            onBuiltBuildingClick={handleBuiltBuildingClick}
          />

          <HotspotsLayer
            hotspots={orderedHotspots}
            mapSize={mapSize}
            discoveredIds={discoveredIds}
            spawningId={spawningId}
            activeHotspotId={hoveredHotspotId || activeHotspotId}
            onActivate={(spot) => setHoveredHotspotId(String(spot?.id))}
            onDeactivate={() => setHoveredHotspotId(null)}
            onHotspotClick={handleHotspotClick}
          />

          <AmbientLayer items={scene?.ambient || []} mapSize={mapSize} />

          {hoveredHotspot && !blockCanvasInput ? (
            <div
              className="pointer-events-none absolute z-[30]"
              style={{
                left: `${getHotspotWorldPoint(hoveredHotspot, mapSize).x}px`,
                top: `${getHotspotWorldPoint(hoveredHotspot, mapSize).y}px`,
                transform: 'translate(-50%, calc(-100% - 14px))',
              }}
              aria-hidden="true"
            >
              <span className="relative block whitespace-nowrap rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-[12px] font-medium leading-none text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-md">
                {getHotspotLabel(hoveredHotspot)}
                <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b border-white/15 bg-black/75" />
              </span>
            </div>
          ) : null}
        </div>

        <IslandBootDock
          open={bootDockOpen}
          onClose={closeBootDock}
          player={player}
          pages={bootDock?.pages}
          typingSpeed={14}
        />

        {!bootDockOpen && (
          <HomeDockOverlay
            config={homeDock}
            allowOpen={!openProjectsFor && !dialogOpen && !detailsOpen}
          />
        )}

        {overlayPos ? (
          <ProjectsOverlay
            open={!!overlayPos}
            view={viewport}
            overlay={overlayPos}
            activeProject={activeProject}
            detailsOpen={detailsOpen}
            dialogOpen={dialogOpen}
            player={player}
            onCloseList={() => {
              setOpenProjectsFor(null)
              setActiveProject(null)
              setDetailsOpen(false)
              setDialogOpen(false)
              animateResetToHome()
            }}
            onProjectPick={(project) => {
              setActiveProject(project)
              setDetailsOpen(true)
              setDialogOpen(false)
            }}
            onOpenDetails={() => setDetailsOpen(true)}
            onCloseDetails={() => setDetailsOpen(false)}
            onCloseDialog={() => setDialogOpen(false)}
          />
        ) : null}
      </div>
    </main>
  )
}
