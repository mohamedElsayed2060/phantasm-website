'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import useIslandDiscovery from '../hooks/useIslandDiscovery'
import usePanCamera from './usePanCamera'
import HotspotsLayer from './HotspotsLayer'
import BuildingsLayer from './BuildingsLayer'
import HintArrows from './HintArrows'
import ResetButton from './ResetButton'
import IntroBubble from './IntroBubble'
import ProjectsDialog from './ProjectsDialog'
import { useRouter } from 'next/navigation'

import { EASE, FALLBACK_HOTSPOTS } from './constants'
import { pctToWorld, computeIntroAnchorWorld } from './worldMath'
import useNormalizedHotspots from './useNormalizedHotspots'

export default function IslandScene({
  sceneKey = 'phantasm-v1',
  backgroundSrc = '/island.gif',
  hotspots = [],
  canvasWidths = { desktop: 2000, tablet: 1600, mobile: 1200 },
}) {
  const router = useRouter()
  // discovery state (persisted)
  const { isDiscovered, discover, reset } = useIslandDiscovery(sceneKey)

  // viewport ref
  const viewportRef = useRef(null)

  // image natural size
  const [imgNatural, setImgNatural] = useState({ w: 1800, h: 1100 })
  const [bgReady, setBgReady] = useState(false)

  // wait for splash overlay before starting
  const [canStart, setCanStart] = useState(false)
  const [didStart, setDidStart] = useState(false)

  // responsive canvas width
  const [activeCanvasWidth, setActiveCanvasWidth] = useState(canvasWidths.desktop)

  // UI state
  const [pendingIntroId, setPendingIntroId] = useState(null) // last clicked hotspot id
  const [introSpot, setIntroSpot] = useState(null)
  const [introPage, setIntroPage] = useState(0)
  const [activeBuildingSpot, setActiveBuildingSpot] = useState(null)
  const [projectsOpen, setProjectsOpen] = useState(false)

  // timers (avoid setTimeout leaks)
  const discoverTimerRef = useRef(null)
  const clickLockRef = useRef(false)
  const queuedHotspotRef = useRef(null) // آخر كليك اتعمل أثناء القفل

  const lockClicks = () => {
    clickLockRef.current = true
  }

  const unlockClicks = () => {
    clickLockRef.current = false

    // ✅ لو في كليك اتعمل أثناء القفل، نفّذه بعد ما نفك
    const q = queuedHotspotRef.current
    queuedHotspotRef.current = null
    if (q) handleHotspotClick(q)
  }

  const closeIntro = useCallback(() => {
    setIntroSpot(null)
    setIntroPage(0)
  }, [])

  const closeProjects = useCallback(() => {
    setProjectsOpen(false)
    setActiveBuildingSpot(null)
  }, [])

  const closeAllOverlays = useCallback(() => {
    closeIntro()
    setPendingIntroId(null)
    closeProjects()
  }, [closeIntro, closeProjects])

  // ----- wait for splash (or already done this session)
  useEffect(() => {
    try {
      if (sessionStorage.getItem('phantasm:splashDone') === '1') {
        setCanStart(true)
        return
      }
    } catch {}

    const onDone = () => setCanStart(true)
    window.addEventListener('phantasm:splashDone', onDone, { once: true })
    return () => window.removeEventListener('phantasm:splashDone', onDone)
  }, [])

  // ----- pick canvas width by breakpoint (desktop/tablet/mobile)
  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth
      const next =
        w >= 1024 ? canvasWidths.desktop : w >= 640 ? canvasWidths.tablet : canvasWidths.mobile
      setActiveCanvasWidth(next)
    }

    pick()
    window.addEventListener('resize', pick)
    return () => window.removeEventListener('resize', pick)
  }, [canvasWidths.desktop, canvasWidths.tablet, canvasWidths.mobile])

  // ----- load background image to read natural size
  useEffect(() => {
    setBgReady(false)

    const im = new Image()
    im.src = backgroundSrc

    im.onload = () => {
      setImgNatural({
        w: im.naturalWidth || 1600,
        h: im.naturalHeight || 900,
      })
      setBgReady(true)
    }

    im.onerror = () => setBgReady(true)

    return () => {
      im.onload = null
      im.onerror = null
    }
  }, [backgroundSrc])

  // ----- lock page scroll while scene mounted
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  // ----- cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (discoverTimerRef.current) clearTimeout(discoverTimerRef.current)
    }
  }, [])

  // ----- derived canvas size (keeps bg aspect)
  const canvasSize = useMemo(() => {
    const aspect = imgNatural.w > 0 ? imgNatural.h / imgNatural.w : 9 / 16
    return { w: activeCanvasWidth, h: Math.round(activeCanvasWidth * aspect) }
  }, [activeCanvasWidth, imgNatural.w, imgNatural.h])
  const projectsAnchor = useMemo(() => {
    if (!activeBuildingSpot) return { worldX: 0, worldY: 0 }
    // same logic as intro: centerX + footY
    return computeIntroAnchorWorld(activeBuildingSpot, canvasSize)
  }, [activeBuildingSpot, canvasSize.w, canvasSize.h])

  // ----- camera (pan/zoom/inertia)
  const {
    viewport,
    camX,
    camY,
    scale,
    cursor,
    panState,
    handlers,
    recenter,
    focusWorldPoint,
    minScale,
  } = usePanCamera({
    viewportRef,
    canvasSize,
    maxScale: 1.15,
    wheelStep: 0.12,
  })

  // ----- when viewport/canvas changes: recenter only if needed (avoid snapping)
  useEffect(() => {
    recenter?.({ keepZoom: true, onlyIfNeeded: true })
  }, [recenter, viewport?.vw, viewport?.vh, canvasSize?.w, canvasSize?.h])

  // ----- when breakpoint width changes: gently reset if needed
  useEffect(() => {
    recenter?.({ keepZoom: false, onlyIfNeeded: true })
  }, [recenter, activeCanvasWidth])

  // ----- allow intro again if background/scene changes
  useEffect(() => {
    setDidStart(false)
    closeAllOverlays()
  }, [backgroundSrc, sceneKey, closeAllOverlays])

  // ----- hotspots list normalized to what layers expect (hotspot/building objects)
  const list = useNormalizedHotspots({
    hotspots,
    canvasSize,
    desktopCanvasWidth: canvasWidths.desktop,
    fallbackHotspots: FALLBACK_HOTSPOTS,
  })

  // ----- soft zoom tuning (click-to-focus)
  const SOFT_ZOOM = useMemo(
    () => ({
      hotspot: { mult: 1.06, cap: 1.12 },
      building: { mult: 1.08, cap: 1.15 },
    }),
    [],
  )

  const getSoftZoomTo = useCallback(
    (kind = 'hotspot') => {
      const cur = scale.get()
      const base = Math.max(cur, minScale)
      const cfg = SOFT_ZOOM[kind] || SOFT_ZOOM.hotspot
      return Math.min(base * cfg.mult, cfg.cap)
    },
    [SOFT_ZOOM, minScale, scale],
  )

  // ----- arrows hint pulse
  const [hintPulseOn, setHintPulseOn] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setHintPulseOn(true)
      setTimeout(() => setHintPulseOn(false), 1200)
    }, 5200)
    return () => clearInterval(t)
  }, [])

  // ready to render scene canvas
  const sceneReady = canStart && bgReady && viewport?.vw > 0 && viewport?.vh > 0

  // start scene intro once (after splash + bg + viewport)
  useEffect(() => {
    if (!sceneReady || didStart) return
    setDidStart(true)
    recenter?.({ keepZoom: false, onlyIfNeeded: false })
  }, [sceneReady, didStart, recenter])

  // ---------------------------------------------
  // Handlers (stable)
  // ---------------------------------------------
  const focusOnSpot = useCallback(
    (spot, { zoomTo, viewportAnchor = { x: 0.5, y: 0.62 }, zoomMode = 'atLeast' } = {}) => {
      const worldX = pctToWorld(spot?.x, canvasSize.w)
      const worldY = pctToWorld(spot?.y, canvasSize.h)

      focusWorldPoint?.({
        worldX,
        worldY,
        viewportAnchor,
        zoomTo,
        zoomMode,
      })
    },
    [canvasSize.w, canvasSize.h, focusWorldPoint],
  )

  const handleHotspotClick = useCallback(
    (spot) => {
      if (!spot?.id) return

      // ✅ لو locked: خزّن آخر كليك واطلع
      if (clickLockRef.current) {
        queuedHotspotRef.current = spot
        return
      }

      // ✅ اقفل أي كليكات تانية لحد ما الانترو يظهر
      lockClicks()

      // close overlays that shouldn't stay open while discovering
      closeProjects()
      closeIntro()

      setPendingIntroId(spot.id)

      // cinematic move first
      focusOnSpot(spot, {
        zoomTo: getSoftZoomTo('hotspot'),
        zoomMode: 'atLeast',
        viewportAnchor: { x: 0.5, y: 0.62 },
      })

      // then discover (after small delay)
      if (discoverTimerRef.current) clearTimeout(discoverTimerRef.current)
      discoverTimerRef.current = setTimeout(() => {
        discover?.(spot.id)
        window.dispatchEvent(new CustomEvent('phantasm:discovered', { detail: { id: spot.id } }))
        // keep pendingIntroId until onBuilt confirms spawn finished
        setPendingIntroId(spot.id)
      }, 520)
    },
    [closeIntro, closeProjects, focusOnSpot, discover, getSoftZoomTo],
  )

  const handleBuilt = useCallback(
    (spot) => {
      if (!spot?.id) return
      if (pendingIntroId !== spot.id) return

      setIntroSpot(spot)
      setIntroPage(0)
      setPendingIntroId(null)
    },
    [pendingIntroId],
  )

  const handleBuildingClick = useCallback(
    (spot) => {
      if (!spot?.id) return

      // ✅ لو locked: تجاهل (أو ممكن تعمل queue تانية للمباني لو حبيت)
      if (clickLockRef.current) return

      // ✅ اقفل الكليك أثناء فتح الديالوج/الفوكس (يمنع تداخلات غريبة)
      lockClicks()

      // close intro bubble
      closeIntro()
      setPendingIntroId(null)

      // open projects dialog
      setActiveBuildingSpot(spot)
      setProjectsOpen(true)

      // focus + zoom
      focusOnSpot(spot, {
        zoomTo: getSoftZoomTo('building'),
        zoomMode: 'atLeast',
        viewportAnchor: { x: 0.5, y: 0.62 },
      })
    },
    [closeIntro, focusOnSpot, getSoftZoomTo],
  )

  // intro anchor (✅ fixed)
  const introAnchor = useMemo(() => {
    if (!introSpot) return { worldX: 0, worldY: 0 }
    return computeIntroAnchorWorld(introSpot, canvasSize)
  }, [introSpot, canvasSize])

  // intro pagination safety
  const introParagraphs = useMemo(
    () => (introSpot?.introParagraphs || []).filter(Boolean),
    [introSpot],
  )
  const introTotal = introParagraphs.length

  useEffect(() => {
    // clamp page when paragraphs change
    setIntroPage((p) => (introTotal ? Math.min(Math.max(p, 0), introTotal - 1) : 0))
  }, [introTotal])

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={viewportRef}
        className="absolute inset-0"
        style={{
          touchAction: 'none',
          cursor,
          overscrollBehavior: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitUserDrag: 'none',
        }}
        onDragStart={(e) => e.preventDefault()}
        {...handlers}
      >
        {sceneReady && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.8, ease: EASE }}
            style={{ transformOrigin: 'center' }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: canvasSize.w,
                height: canvasSize.h,
                x: camX,
                y: camY,
                scale,
                transformOrigin: '0 0',
                willChange: 'transform',
              }}
            >
              <img
                src={backgroundSrc}
                alt="Island"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                }}
              />

              <HotspotsLayer
                bgReady={bgReady}
                canvasSize={canvasSize}
                hotspots={list}
                isDiscovered={isDiscovered}
                discover={discover}
                onHotspotClick={handleHotspotClick}
              />

              <BuildingsLayer
                bgReady={bgReady}
                canvasSize={canvasSize}
                hotspots={list}
                isDiscovered={isDiscovered}
                onBuilt={handleBuilt}
                onBuildingClick={handleBuildingClick}
              />
            </motion.div>
          </motion.div>
        )}

        <IntroBubble
          open={!!introSpot}
          title={introSpot?.introTitle || introSpot?.label}
          paragraphs={introParagraphs}
          pageIndex={introPage}
          onPrev={() => setIntroPage((p) => Math.max(0, p - 1))}
          onNext={() => setIntroPage((p) => (introTotal ? Math.min(introTotal - 1, p + 1) : 0))}
          onClose={closeIntro}
          preferredPlacement={introSpot?.introPlacement || 'auto'}
          viewport={viewport}
          camX={camX}
          camY={camY}
          scale={scale}
          // ✅ anchor at building visual center (not hotspot foot)
          worldX={introAnchor.worldX}
          worldY={introAnchor.worldY}
          onShown={unlockClicks}
        />

        <ResetButton onReset={reset} />
        <HintArrows panState={panState} hintPulseOn={hintPulseOn} />

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-white/80">
          Drag the island. Tap a glowing point to discover it.
        </div>
      </div>

      <ProjectsDialog
        open={projectsOpen}
        spot={activeBuildingSpot}
        onClose={() => {
          setProjectsOpen(false)
          setActiveBuildingSpot(null)
        }}
        viewport={viewport}
        camX={camX}
        camY={camY}
        scale={scale}
        worldX={projectsAnchor.worldX}
        worldY={projectsAnchor.worldY}
        preferredPlacement="auto"
        onCheckItOut={(p) => {
          if (!p?.slug) return
          router.push(`/project-details/${p.slug}`)
        }}
        onShown={unlockClicks}
      />
    </div>
  )
}
