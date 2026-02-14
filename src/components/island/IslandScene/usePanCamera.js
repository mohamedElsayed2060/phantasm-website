'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMotionValue } from 'framer-motion'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

function getViewportSize(el) {
  if (!el) return { vw: 0, vh: 0, rect: null }
  const rect = el.getBoundingClientRect()
  return { vw: rect.width, vh: rect.height, rect }
}

function clampCam({ x, y, vw, vh, cw, ch }) {
  const minX = Math.min(0, vw - cw)
  const maxX = 0
  const minY = Math.min(0, vh - ch)
  const maxY = 0
  return { x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) }
}

function computeMinScale(vw, vh, w, h) {
  if (!vw || !vh || !w || !h) return 1
  return Math.max(vw / w, vh / h)
}

function approach(current, target, lambda, dt) {
  // exponential smoothing: slower and very "viewer-like"
  const t = 1 - Math.exp(-lambda * dt)
  return current + (target - current) * t
}

export default function usePanCamera({
  viewportRef,
  canvasSize, // { w, h }
  maxScale = 1.15,

  // feel / tuning
  panSmooth = 4.5, // bigger => snappier, smaller => slower (viewer-like)
  zoomSmooth = 3.8,
  inertiaFriction = 0.92, // smaller => quicker stop, 1 => infinite inertia (not recommended)
  inertiaMaxVel = 55,
  wheelStep = 0.09, // per wheel "tick"
}) {
  // motion values (what IslandScene uses)
  const camX = useMotionValue(0)
  const camY = useMotionValue(0)
  const scale = useMotionValue(1)

  const [cursor, setCursor] = useState('grab')
  const [panState, setPanState] = useState({ isPanning: false })
  const [viewport, setViewport] = useState({ vw: 0, vh: 0 })

  // targets (what user input sets)
  const targetRef = useRef({ x: 0, y: 0, s: 1 })
  const velRef = useRef({ vx: 0, vy: 0 })
  const draggingRef = useRef(false)
  const pointerIdRef = useRef(null)
  const lastRef = useRef({ x: 0, y: 0, t: 0 })
  const rafRef = useRef(null)

  // zoom anchor (keep point under mouse)
  const zoomAnchorRef = useRef(null) // { worldX, worldY, screenX, screenY }

  // viewport measure + resize
  useEffect(() => {
    const el = viewportRef?.current
    if (!el) return

    const update = () => {
      const { vw, vh } = getViewportSize(el)
      setViewport({ vw, vh })
    }
    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)

    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [viewportRef])

  const minScale = useMemo(() => {
    return computeMinScale(viewport.vw, viewport.vh, canvasSize.w, canvasSize.h)
  }, [viewport.vw, viewport.vh, canvasSize.w, canvasSize.h])

  // initialize / re-clamp when minScale changes
  useEffect(() => {
    // center-ish start (slightly zoomed)
    const startS = clamp(minScale * 1.05, minScale, maxScale)

    const cw = canvasSize.w * startS
    const ch = canvasSize.h * startS

    const desiredX = (viewport.vw - cw) / 2
    const desiredY = (viewport.vh - ch) / 2

    const clamped = clampCam({
      x: desiredX,
      y: desiredY,
      vw: viewport.vw,
      vh: viewport.vh,
      cw,
      ch,
    })

    // ✅ IMPORTANT: set scale to the SAME scale you used for centering
    scale.set(startS)
    camX.set(clamped.x)
    camY.set(clamped.y)

    targetRef.current.x = clamped.x
    targetRef.current.y = clamped.y
    targetRef.current.s = startS

    // ✅ start RAF so it stabilizes immediately (no need for first mouse interaction)
    startRaf()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minScale, maxScale, viewport.vw, viewport.vh, canvasSize.w, canvasSize.h])

  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  const startRaf = () => {
    if (rafRef.current) return
    let lastT = performance.now()

    const tick = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000) // seconds
      lastT = t

      const curS = scale.get()
      const curX = camX.get()
      const curY = camY.get()

      // === inertia updates target when not dragging
      if (!draggingRef.current) {
        const { vx, vy } = velRef.current
        const nvx = vx * inertiaFriction
        const nvy = vy * inertiaFriction
        velRef.current = { vx: nvx, vy: nvy }

        // If velocity still exists, push target
        if (Math.abs(nvx) > 0.05 || Math.abs(nvy) > 0.05) {
          targetRef.current.x += nvx
          targetRef.current.y += nvy
        } else {
          velRef.current = { vx: 0, vy: 0 }
        }
      }

      // === smooth scale toward target
      const desiredS = clamp(targetRef.current.s, minScale, maxScale)
      const nextS = approach(curS, desiredS, zoomSmooth, dt)

      // If zooming and we have an anchor, adjust target cam to keep anchor stable
      const anchor = zoomAnchorRef.current

      // ✅ keep a "before clamp" snapshot (used to detect wobble at edges)
      let beforeClampX = targetRef.current.x
      let beforeClampY = targetRef.current.y

      if (anchor && Math.abs(nextS - curS) > 1e-6) {
        // keep the world point under cursor constant:
        const nx = anchor.screenX - anchor.worldX * nextS
        const ny = anchor.screenY - anchor.worldY * nextS
        targetRef.current.x = nx
        targetRef.current.y = ny

        // compare against clamped target after we clamp
        beforeClampX = nx
        beforeClampY = ny
      }

      // === smooth cam toward target
      const cw = canvasSize.w * nextS
      const ch = canvasSize.h * nextS

      // clamp target before approaching (prevents edge flash)
      const clampedTarget = clampCam({
        x: targetRef.current.x,
        y: targetRef.current.y,
        vw: viewport.vw,
        vh: viewport.vh,
        cw,
        ch,
      })
      targetRef.current.x = clampedTarget.x
      targetRef.current.y = clampedTarget.y

      // ✅ If clamping fought the anchor (near edges), drop anchor to avoid wobble
      if (zoomAnchorRef.current) {
        const dx = Math.abs(clampedTarget.x - beforeClampX)
        const dy = Math.abs(clampedTarget.y - beforeClampY)
        if (dx > 1.2 || dy > 1.2) {
          zoomAnchorRef.current = null
        }
      }

      let nextX, nextY

      if (zoomAnchorRef.current && Math.abs(nextS - curS) > 1e-6) {
        // ✅ أثناء الزوم بالـ wheel: امسك الكاميرا فورًا على target
        // ده بيمنع اليمين/شمال الناتج عن lag
        nextX = targetRef.current.x
        nextY = targetRef.current.y
      } else {
        nextX = approach(curX, targetRef.current.x, panSmooth, dt)
        nextY = approach(curY, targetRef.current.y, panSmooth, dt)
      }

      // clamp final
      const clampedFinal = clampCam({
        x: nextX,
        y: nextY,
        vw: viewport.vw,
        vh: viewport.vh,
        cw,
        ch,
      })

      scale.set(nextS)
      camX.set(clampedFinal.x)
      camY.set(clampedFinal.y)

      // stop RAF when everything settled
      const done =
        Math.abs(desiredS - nextS) < 0.0005 &&
        Math.abs(targetRef.current.x - clampedFinal.x) < 0.3 &&
        Math.abs(targetRef.current.y - clampedFinal.y) < 0.3 &&
        Math.abs(velRef.current.vx) < 0.1 &&
        Math.abs(velRef.current.vy) < 0.1 &&
        !draggingRef.current

      if (done) {
        stopRaf()
        zoomAnchorRef.current = null
        setCursor('grab')
        setPanState({ isPanning: false })
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  // ====== Wheel (native, passive:false) to avoid console error ======
  useEffect(() => {
    const el = viewportRef?.current
    if (!el) return

    const onWheelNative = (e) => {
      // ignore wheel if hovering a hotspot
      if (
        e.target?.closest?.('[data-hotspot="1"]') ||
        e.target?.closest?.('[data-building="1"]') ||
        e.target?.closest?.('[data-overlay="1"]')
      ) {
        return
      }

      // ✅ now preventDefault works because passive:false
      e.preventDefault()
      velRef.current = { vx: 0, vy: 0 }

      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      // we treat mx/my as screen coords inside viewport:
      const curS = scale.get()
      const curX = camX.get()
      const curY = camY.get()

      // set zoom anchor world point under mouse
      const worldX = (mx - curX) / curS
      const worldY = (my - curY) / curS
      zoomAnchorRef.current = { worldX, worldY, screenX: mx, screenY: my }

      const direction = e.deltaY > 0 ? -1 : 1
      const target = curS * (1 + direction * wheelStep)
      targetRef.current.s = clamp(target, minScale, maxScale)

      startRaf()
    }

    el.addEventListener('wheel', onWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', onWheelNative)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportRef, minScale, maxScale, wheelStep])

  // ====== Pointer drag ======
  const onPointerDown = (e) => {
    if (
      e.target?.closest?.('[data-hotspot="1"]') ||
      e.target?.closest?.('[data-building="1"]') ||
      e.target?.closest?.('[data-overlay="1"]')
    ) {
      return
    }

    draggingRef.current = true
    pointerIdRef.current = e.pointerId
    lastRef.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    velRef.current = { vx: 0, vy: 0 }

    setCursor('grabbing')
    setPanState({ isPanning: true })

    e.currentTarget.setPointerCapture?.(e.pointerId)
    startRaf()
  }

  const onPointerMove = (e) => {
    if (!draggingRef.current) return
    if (pointerIdRef.current !== e.pointerId) return

    const now = performance.now()
    const dt = Math.max(1, now - lastRef.current.t)
    const dx = e.clientX - lastRef.current.x
    const dy = e.clientY - lastRef.current.y

    lastRef.current = { x: e.clientX, y: e.clientY, t: now }

    // update target (not direct cam) => smoother feel
    targetRef.current.x += dx
    targetRef.current.y += dy

    // velocity for inertia (cap)
    const vx = clamp((dx / dt) * 16, -inertiaMaxVel, inertiaMaxVel)
    const vy = clamp((dy / dt) * 16, -inertiaMaxVel, inertiaMaxVel)
    velRef.current = { vx, vy }

    startRaf()
  }

  const onPointerUp = (e) => {
    if (!draggingRef.current) return
    if (pointerIdRef.current !== e.pointerId) return

    draggingRef.current = false
    pointerIdRef.current = null

    // keep RAF running for inertia deceleration
    startRaf()
  }

  const onPointerCancel = () => {
    draggingRef.current = false
    pointerIdRef.current = null
    velRef.current = { vx: 0, vy: 0 }
    startRaf()
  }

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    // ⚠️ we intentionally do NOT expose onWheel here anymore
  }

  function hasBlackEdges({ x, y, vw, vh, cw, ch, tolerance = 0.5 }) {
    // if the canvas doesn't fully cover viewport, you'll see black edges.
    // x,y are top-left of canvas in viewport coords.
    // condition for full cover: x <= 0 AND y <= 0 AND (x+cw) >= vw AND (y+ch) >= vh
    if (x > tolerance) return true
    if (y > tolerance) return true
    if (x + cw < vw - tolerance) return true
    if (y + ch < vh - tolerance) return true
    return false
  }

  const recenter = ({ keepZoom = true, onlyIfNeeded = false } = {}) => {
    if (!viewport.vw || !viewport.vh) return
    if (!canvasSize.w || !canvasSize.h) return

    const curS = scale.get()
    const nextS = keepZoom
      ? clamp(Math.max(curS, minScale), minScale, maxScale)
      : clamp(minScale * 1.05, minScale, maxScale)

    const cw = canvasSize.w * nextS
    const ch = canvasSize.h * nextS

    // If onlyIfNeeded: check if current view would show edges at this scale.
    if (onlyIfNeeded) {
      const curX = camX.get()
      const curY = camY.get()
      const edges = hasBlackEdges({
        x: curX,
        y: curY,
        vw: viewport.vw,
        vh: viewport.vh,
        cw: canvasSize.w * curS,
        ch: canvasSize.h * curS,
      })

      // If no black edges AND scale already ok, do nothing
      const scaleOk = curS >= minScale - 0.0001
      if (!edges && scaleOk) return
    }

    const desiredX = (viewport.vw - cw) / 2
    const desiredY = (viewport.vh - ch) / 2

    const clamped = clampCam({
      x: desiredX,
      y: desiredY,
      vw: viewport.vw,
      vh: viewport.vh,
      cw,
      ch,
    })

    targetRef.current.s = nextS
    targetRef.current.x = clamped.x
    targetRef.current.y = clamped.y

    startRaf()
  }

  const getWorldFromViewport = (screenX, screenY) => {
    const s = scale.get()
    const x = camX.get()
    const y = camY.get()
    return {
      worldX: (screenX - x) / s,
      worldY: (screenY - y) / s,
    }
  }

  const focusWorldPoint = ({
    worldX,
    worldY,
    // where to place that world point inside viewport (0..1)
    // مثال: { x: 0.5, y: 0.62 } يعني في النص أفقيًا وتحت شوية
    viewportAnchor = { x: 0.5, y: 0.62 },

    // zoom behavior
    zoomTo = null, // number | null
    zoomMode = 'atLeast', // 'atLeast' | 'exact' | 'keep'
    // animation feel
    impulse = true, // start RAF
  } = {}) => {
    if (!viewport.vw || !viewport.vh) return

    const curS = scale.get()

    let nextS = curS
    if (zoomMode === 'keep') {
      nextS = curS
    } else if (typeof zoomTo === 'number') {
      if (zoomMode === 'exact') nextS = zoomTo
      else if (zoomMode === 'atLeast') nextS = Math.max(curS, zoomTo)
    }

    nextS = clamp(nextS, minScale, maxScale)

    // desired screen coords inside viewport
    const sx = viewport.vw * (viewportAnchor?.x ?? 0.5)
    const sy = viewport.vh * (viewportAnchor?.y ?? 0.5)

    // compute camera so that: screen = cam + world*scale
    const desiredX = sx - worldX * nextS
    const desiredY = sy - worldY * nextS

    // clamp by canvas bounds at that scale
    const cw = canvasSize.w * nextS
    const ch = canvasSize.h * nextS

    const clamped = clampCam({
      x: desiredX,
      y: desiredY,
      vw: viewport.vw,
      vh: viewport.vh,
      cw,
      ch,
    })

    targetRef.current.s = nextS
    targetRef.current.x = clamped.x
    targetRef.current.y = clamped.y

    // keep zoomAnchor off (we're programmatically moving)
    zoomAnchorRef.current = null

    if (impulse) startRaf()
  }

  return {
    viewport,
    camX,
    camY,
    scale,
    cursor,
    panState,
    handlers,
    draggingRef,
    minScale,
    recenter,
    getWorldFromViewport,
    focusWorldPoint,
  }
}
