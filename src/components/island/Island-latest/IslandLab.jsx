'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'

import { loadDiscoveredIds, saveDiscoveredIds } from './storage'
import {
  clamp,
  percentToPxX,
  percentToPxY,
  worldToScreen,
  choosePlacementNoBottom,
  clampToViewportX,
} from './utils'

import HotspotsLayer from './layers/HotspotsLayer'
import BuildingsLayer from './layers/BuildingsLayer'
import ProjectsOverlay from './overlays/ProjectsOverlay'
import IslandBootDock from './overlays/IslandBootDock'

const SHOW_DEV = process.env.NEXT_PUBLIC_ISLAND_DEV === '1'

function toAbsoluteUrl(maybeRelative) {
  const s = String(maybeRelative || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('//')) return window.location.protocol + s
  if (s.startsWith('/')) return window.location.origin + s
  return window.location.origin + '/' + s
}

const POPOVER_W = 360
const POPOVER_H = 190
const POPOVER_MARGIN = 14
const POPOVER_GAP = 14
const LAST_TRANSFORM_KEY = 'phantasm:island:lastTransform'
export default function IslandLab({ hotspots = [], scene, bootDock }) {
  const HOTSPOTS = Array.isArray(hotspots) ? hotspots : []
  const backgroundSrc = scene?.backgroundSrc

  const maxZoomMult = Number(scene?.maxZoomMult)
  const cmsReady = Boolean(backgroundSrc) && Number.isFinite(maxZoomMult)

  const viewportRef = useRef(null)
  const apiRef = useRef(null)

  const [view, setView] = useState({ w: 0, h: 0 })
  const [map, setMap] = useState({ w: 1920, h: 1080, ready: false })
  const isInteractingRef = useRef(false)
  const resizeTimerRef = useRef(null)
  const lastViewRef = useRef({ w: 0, h: 0 })

  // ✅ discovered persistence
  const [discoveredIds, setDiscoveredIds] = useState(() => loadDiscoveredIds())
  const [spawningId, setSpawningId] = useState(null)
  const spawnTimerRef = useRef(null)

  // ✅ open projects overlay for building
  const [openProjectsFor, setOpenProjectsFor] = useState(null)

  // ✅ latest transform state for overlay placement
  const [transformState, setTransformState] = useState({ x: 0, y: 0, scale: 1 })

  // ✅ project overlay states
  const [activeProject, setActiveProject] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const rafRef = useRef(0)
  const lastTransformRef = useRef({ x: 0, y: 0, scale: 1 })

  // ✅ boot dock
  const [bootDockOpen, setBootDockOpen] = useState(false)
  const BOOT_DOCK_DISMISSED = 'phantasm:islandBootDockDismissed'

  // ✅ scene fade-in
  const [sceneReady, setSceneReady] = useState(false)

  // ✅ player (localStorage)
  const [player, setPlayer] = useState({
    name: 'Player',
    avatarSrc: '',
  })
  // ✅ overlay position & placement (screen-space) for openProjectsFor
  const overlay = useMemo(() => {
    if (!openProjectsFor) return null
    const spot = HOTSPOTS.find((h) => String(h.id) === String(openProjectsFor))
    if (!spot || !map.ready || !view.w || !view.h) return null

    const baseWorldX = percentToPxX(spot.x, map.w)
    const baseWorldY = percentToPxY(spot.y, map.h)

    const bw = Number(spot.buildingW || 240)
    const bh = Number(spot.buildingH || 240)
    const ax = Number(spot.anchorX ?? 0.5)
    const ay = Number(spot.anchorY ?? 0.9)

    const buildingWorldLeft = baseWorldX - ax * bw
    const buildingWorldTop = baseWorldY - ay * bh
    const buildingWorldRight = buildingWorldLeft + bw
    const buildingWorldBottom = buildingWorldTop + bh

    const tl = worldToScreen({
      worldX: buildingWorldLeft,
      worldY: buildingWorldTop,
      state: transformState,
    })
    const br = worldToScreen({
      worldX: buildingWorldRight,
      worldY: buildingWorldBottom,
      state: transformState,
    })

    const buildingScreen = {
      left: tl.sx,
      top: tl.sy,
      right: br.sx,
      bottom: br.sy,
      cx: (tl.sx + br.sx) / 2,
      cy: (tl.sy + br.sy) / 2,
    }

    const popW = Math.min(POPOVER_W, view.w - 24)
    const popH = POPOVER_H

    const placement = choosePlacementNoBottom({
      viewportW: view.w,
      viewportH: view.h,
      buildingScreen,
      popoverW: popW,
      popoverH: popH,
      margin: POPOVER_MARGIN,
      gap: POPOVER_GAP,
    })

    let left = buildingScreen.cx
    let top = buildingScreen.top - POPOVER_GAP

    if (placement === 'top') {
      left = clampToViewportX(buildingScreen.cx, view.w, popW, POPOVER_MARGIN)
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

    return { spot, placement, left, top, popW, popH, buildingScreen }
  }, [openProjectsFor, map.ready, map.w, map.h, view.w, view.h, transformState, HOTSPOTS])

  const showLoading = !cmsReady
  // 1) اقرأ player مرة واحدة عند mount

  useEffect(() => {
    if (!sceneReady) return
    try {
      sessionStorage.setItem(LAST_TRANSFORM_KEY, JSON.stringify(transformState))
    } catch {}
  }, [sceneReady, transformState])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('phantasm:player')
      if (!raw) return
      const data = JSON.parse(raw)

      setPlayer((prev) => ({
        ...prev,
        name: data?.name || prev.name,
        avatarSrc: data?.avatarImage ? toAbsoluteUrl(data.avatarImage) : prev.avatarSrc,
      }))
    } catch {}
  }, [])

  // 2) اسمع event بعد اختيار الأفاتار
  useEffect(() => {
    const onPlayerSelected = () => {
      try {
        const raw = localStorage.getItem('phantasm:player')
        if (!raw) return
        const data = JSON.parse(raw)

        setPlayer((prev) => ({
          ...prev,
          name: data?.name || prev.name,
          avatarSrc: data?.avatarImage ? toAbsoluteUrl(data.avatarImage) : prev.avatarSrc,
        }))
        setDiscoveredIds(loadDiscoveredIds())
      } catch {}
    }

    window.addEventListener('phantasm:playerSelected', onPlayerSelected)
    return () => window.removeEventListener('phantasm:playerSelected', onPlayerSelected)
  }, [])

  // ====== measure viewport ======
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const update = () => {
      const r = el.getBoundingClientRect()
      setView({ w: Math.round(r.width), h: Math.round(r.height) })
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  // ====== read natural size (from CMS background) ======
  useEffect(() => {
    if (!backgroundSrc) return
    const img = new Image()
    img.src = backgroundSrc
    img.onload = () => {
      setMap({
        w: img.naturalWidth || 1920,
        h: img.naturalHeight || 1080,
        ready: true,
      })
    }
    img.onerror = () => setMap((m) => ({ ...m, ready: true }))
  }, [backgroundSrc])

  // ✅ load discovered from LS once
  // useEffect(() => {
  //   setDiscoveredIds(loadDiscoveredIds())
  // }, [])

  // ✅ save discovered to LS on change
  useEffect(() => {
    saveDiscoveredIds(discoveredIds)
  }, [discoveredIds])

  // ====== boot dock open logic ======
  useEffect(() => {
    if (!cmsReady || !map.ready || !view.w || !view.h) return
    if (!bootDock?.enabled) return
    if (!player?.avatarSrc) return

    const pagesLen = Array.isArray(bootDock?.pages) ? bootDock.pages.length : 0
    if (!pagesLen) return

    try {
      if (sessionStorage.getItem(BOOT_DOCK_DISMISSED) === '1') return
    } catch {}

    setBootDockOpen(true)
  }, [
    cmsReady,
    map.ready,
    view.w,
    view.h,
    player?.avatarSrc,
    bootDock?.enabled,
    bootDock?.pages?.length,
  ])

  const closeBootDock = () => {
    setBootDockOpen(false)
    try {
      sessionStorage.setItem(BOOT_DOCK_DISMISSED, '1')
    } catch {}
  }

  // ====== cover scale (no black edges at min) ======
  const coverScale = useMemo(() => {
    if (!view.w || !view.h || !map.w || !map.h) return 1
    return Math.max(view.w / map.w, view.h / map.h)
  }, [view.w, view.h, map.w, map.h])

  // ====== clamp helper ======
  const clampToBounds = useCallback(
    ({ x, y, scale }) => {
      const vw = view.w
      const vh = view.h
      const cw = map.w * scale
      const ch = map.h * scale

      let nx = x
      let ny = y

      if (cw <= vw) nx = (vw - cw) / 2
      else nx = clamp(nx, vw - cw, 0)

      if (ch <= vh) ny = (vh - ch) / 2
      else ny = clamp(ny, vh - ch, 0)

      return { x: nx, y: ny, scale }
    },
    [view.w, view.h, map.w, map.h],
  )

  // ====== reset centered ======
  const reset = useCallback(
    ({ duration = 250 } = {}) => {
      if (!apiRef.current) return
      if (!view.w || !view.h || !map.w || !map.h) return

      const s = coverScale
      const cw = map.w * s
      const ch = map.h * s
      const x = (view.w - cw) / 2
      const y = (view.h - ch) / 2

      const clamped = clampToBounds({ x, y, scale: s })
      apiRef.current.setTransform(clamped.x, clamped.y, clamped.scale, duration, 'easeInOutQuad')
    },
    [coverScale, clampToBounds, map.w, map.h, view.w, view.h],
  )

  // ====== focus hotspot/building ======
  const focusSpot = useCallback(
    (spot, { targetScaleMult = 1.3, duration = 650 } = {}) => {
      if (!apiRef.current) return
      if (!view.w || !view.h || !map.w || !map.h) return

      const targetScale = Math.max(coverScale, coverScale * targetScaleMult)

      const anchorX = view.w * 0.5
      const anchorY = view.h * 0.62

      const pxX = (spot.x / 100) * map.w
      const pxY = (spot.y / 100) * map.h

      const desiredX = anchorX - pxX * targetScale
      const desiredY = anchorY - pxY * targetScale

      const clamped = clampToBounds({ x: desiredX, y: desiredY, scale: targetScale })
      apiRef.current.setTransform(clamped.x, clamped.y, clamped.scale, duration, 'easeInOutQuad')
    },
    [coverScale, clampToBounds, view.w, view.h, map.w, map.h],
  )

  // ====== clamp AFTER interactions (no jitter) ======
  const snapToBounds = useCallback(
    ({ duration = 0 } = {}) => {
      if (!apiRef.current) return
      if (!view.w || !view.h || !map.w || !map.h) return

      const st = apiRef.current.state
      if (!st) return

      const s = Math.max(st.scale, coverScale)
      const clamped = clampToBounds({ x: st.positionX, y: st.positionY, scale: s })

      const dx = Math.abs(clamped.x - st.positionX)
      const dy = Math.abs(clamped.y - st.positionY)
      const ds = Math.abs(clamped.scale - st.scale)

      if (dx > 0.5 || dy > 0.5 || ds > 0.001) {
        apiRef.current.setTransform(clamped.x, clamped.y, clamped.scale, duration, 'easeOutQuad')
      }
    },
    [clampToBounds, coverScale, view.w, view.h, map.w, map.h],
  )

  // ====== init once ======
  const didInit = useRef(false)
  useEffect(() => {
    if (!cmsReady) return
    if (!map.ready) return
    if (!view.w || !view.h) return
    if (!apiRef.current) return
    if (didInit.current) return

    didInit.current = true

    // ✅ حاول restore transform (لو راجع Back)
    let restored = false
    try {
      const raw = sessionStorage.getItem(LAST_TRANSFORM_KEY)
      if (raw) {
        const t = JSON.parse(raw)
        const s = Math.max(Number(t?.scale || 0), coverScale)
        const clamped = clampToBounds({
          x: Number(t?.x || 0),
          y: Number(t?.y || 0),
          scale: s,
        })
        apiRef.current.setTransform(clamped.x, clamped.y, clamped.scale, 0, 'linear')
        restored = true
      }
    } catch {}

    // ✅ لو مفيش restore اعمل reset الطبيعي
    if (!restored) reset({ duration: 0 })

    try {
      sessionStorage.setItem('phantasm:bootReady', '1')
      window.dispatchEvent(new CustomEvent('phantasm:bootReady'))
    } catch {}

    setSceneReady(true)
  }, [cmsReady, map.ready, view.w, view.h, reset])
  const blockCanvasInput = Boolean(overlay)

  // ====== resize => clamp ======
  useEffect(() => {
    if (!didInit.current) return
    if (!map.ready) return
    if (!apiRef.current) return
    if (!view.w || !view.h) return

    // ✅ أول مرة بس نخزن المقاس ومانعملش reset
    const prev = lastViewRef.current
    if (!prev.w || !prev.h) {
      lastViewRef.current = { w: view.w, h: view.h }
      return
    }

    const dw = Math.abs(view.w - prev.w)
    const dh = Math.abs(view.h - prev.h)

    // ✅ حد أدنى للتغيير (عشان نبعد عن jitter)
    // devtools close/open غالبًا بيغير أكتر من كده
    const THRESHOLD_PX = 80
    if (dw < THRESHOLD_PX && dh < THRESHOLD_PX) {
      lastViewRef.current = { w: view.w, h: view.h }
      return
    }

    lastViewRef.current = { w: view.w, h: view.h }

    // ✅ لو المستخدم بيسحب دلوقتي، سيبه
    if (isInteractingRef.current) return
    // ✅ لو overlay مفتوح (إنت عامل blockCanvasInput) سيبه
    if (blockCanvasInput) return

    // ✅ debounce
    if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = window.setTimeout(() => {
      if (isInteractingRef.current) return
      if (blockCanvasInput) return
      reset({ duration: 0 }) // 👈 نفس زرار Reset بتاعك
    }, 120)

    return () => {
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
    }
  }, [view.w, view.h, map.ready, reset, blockCanvasInput])

  // ✅ clear timer on unmount
  useEffect(() => {
    return () => {
      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current)
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
    }
  }, [])

  // ✅ click hotspot flow:
  const onHotspotClick = useCallback(
    (spot) => {
      if (!spot?.id) return

      const sid = String(spot.id)

      if (discoveredIds.has(sid)) {
        setOpenProjectsFor(sid)
        return
      }

      focusSpot(spot)

      // hide immediately by marking discovered
      setDiscoveredIds((prev) => {
        const next = new Set(prev)
        next.add(sid)
        return next
      })

      // spawn building now
      setSpawningId(sid)
      setOpenProjectsFor(null)

      if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current)
      const ms = Number(spot.spawnDurationMs || 1700)

      spawnTimerRef.current = window.setTimeout(() => {
        setSpawningId((curr) => (String(curr) === sid ? null : curr))
        setOpenProjectsFor(sid)
      }, ms)
    },
    [discoveredIds, focusSpot],
  )

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 bg-[#050505] overflow-hidden"
      style={{ opacity: sceneReady ? 1 : 0 }}
    >
      {showLoading ? <div className="absolute inset-0 z-[200] bg-[#050505]" /> : null}

      <TransformWrapper
        ref={(instance) => {
          apiRef.current = instance
        }}
        initialScale={coverScale}
        minScale={coverScale}
        maxScale={coverScale * maxZoomMult}
        centerOnInit={false}
        limitToBounds={true}
        disablePadding={true}
        wheel={{ wheelDisabled: blockCanvasInput, step: 0.05, smoothStep: 0.35 }}
        smooth={false}
        zoomAnimation={{ disabled: false, animationTime: 300, animationType: 'easeOutQuart' }}
        panning={{ disabled: blockCanvasInput, velocityDisabled: false }}
        velocityAnimation={{ sensitivity: 1, animationTime: 400, animationType: 'easeOutQuart' }}
        onPanningStart={() => {
          isInteractingRef.current = true
        }}
        onZoomStart={() => {
          isInteractingRef.current = true
        }}
        onPanningStop={() => {
          isInteractingRef.current = false
          snapToBounds({ duration: 400 })
        }}
        onZoomStop={() => {
          isInteractingRef.current = false
          snapToBounds({ duration: 400 })
        }}
        onTransformed={(ref) => {
          const st = ref?.state
          if (!st) return

          lastTransformRef.current = { x: st.positionX, y: st.positionY, scale: st.scale }

          if (rafRef.current) return
          rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = 0
            setTransformState(lastTransformRef.current)
          })
        }}
        doubleClick={{ disabled: true }}
        pinch={{ disabled: blockCanvasInput, step: 5 }}
      >
        {() => (
          <>
            {SHOW_DEV ? (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex gap-2 pointer-events-auto">
                {HOTSPOTS.map((spot) => (
                  <button
                    key={String(spot.id)}
                    className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/20 text-xs"
                    onClick={() => focusSpot(spot)}
                  >
                    {spot.name}
                  </button>
                ))}
                <button
                  className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/20 text-xs"
                  onClick={() => reset({ duration: 250 })}
                >
                  Reset
                </button>
              </div>
            ) : null}

            {/* ✅ IMPORTANT: خليها 100% بدل 100vw/100vh لتقليل مشاكل الموبايل */}
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: `${map.w}px`, height: `${map.h}px` }}
            >
              <div style={{ width: map.w, height: map.h, position: 'relative' }}>
                <img
                  src={backgroundSrc}
                  alt="Island Map"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />

                <HotspotsLayer
                  map={map}
                  hotspots={HOTSPOTS}
                  discoveredIds={discoveredIds}
                  spawningId={spawningId}
                  onHotspotClick={onHotspotClick}
                />

                <BuildingsLayer
                  map={map}
                  hotspots={HOTSPOTS}
                  discoveredIds={discoveredIds}
                  spawningId={spawningId}
                  onBuiltBuildingClick={(spot) => {
                    focusSpot(spot, { targetScaleMult: 1.12, duration: 450 })
                    setOpenProjectsFor(String(spot.id))

                    setActiveProject(null)
                    setDetailsOpen(false)
                    setDialogOpen(false)
                  }}
                />
              </div>
            </TransformComponent>

            <IslandBootDock
              open={bootDockOpen}
              onClose={closeBootDock}
              player={player}
              title={bootDock?.title}
              pages={bootDock?.pages}
            />

            {overlay ? (
              <ProjectsOverlay
                open={!!overlay}
                view={view}
                overlay={overlay}
                activeProject={activeProject}
                detailsOpen={detailsOpen}
                dialogOpen={dialogOpen}
                player={player}
                onCloseList={() => {
                  setOpenProjectsFor(null)
                  setDetailsOpen(false)
                  setDialogOpen(false)
                }}
                onProjectPick={(p) => {
                  setActiveProject(p)
                  setDetailsOpen(true)
                  if (view.w >= 768) setDialogOpen(true)
                }}
                onOpenDetails={() => setDetailsOpen(true)}
                onCloseDetails={() => setDetailsOpen(false)}
                onCloseDialog={() => setDialogOpen(false)}
              />
            ) : null}
          </>
        )}
      </TransformWrapper>
    </div>
  )
}
