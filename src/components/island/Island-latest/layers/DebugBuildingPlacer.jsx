'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

const clamp01 = (v) => Math.max(0, Math.min(1, v))

// ─── حجم أيقونة الهوتسبوت الثابت ───
const ICON_SIZE = 40

export default function DebugBuildingPlacer({
  map,
  spot,
  pos,
  setPos,
  anchor,
  viewportRef,
  transformState,
}) {
  const bw = Number(spot?.buildingW || 240)
  const bh = Number(spot?.buildingH || 240)

  // ─── مصدر الحقيقة: ركن الصندوق الأيسر العلوي ───
  const [boxOrigin, setBoxOrigin] = useState(() => ({
    x: pos.worldX - (anchor?.x ?? 0.5) * bw,
    y: pos.worldY - (anchor?.y ?? 1) * bh,
  }))

  // ─── مكان أيقونة الهوتسبوت (نقطة الـ x/y) ───
  // نبدأ بنفس pos اللي بيجي من الـ parent
  const [iconPos, setIconPos] = useState({ x: pos.worldX, y: pos.worldY })

  // dot = anchor نسبي (0-1) داخل صندوق المبنى
  const [dot, setDot] = useState({ x: anchor?.x ?? 0.5, y: anchor?.y ?? 1 })

  // هل الـ dot شغال دلوقتي (عشان نظهر المبنى)
  const [isDraggingDot, setIsDraggingDot] = useState(false)

  // refs
  const boxRef = useRef(boxOrigin)
  const dotRef = useRef(dot)
  const iconRef = useRef(iconPos)
  useEffect(() => {
    boxRef.current = boxOrigin
  }, [boxOrigin])
  useEffect(() => {
    dotRef.current = dot
  }, [dot])
  useEffect(() => {
    iconRef.current = iconPos
  }, [iconPos])

  // sync preset anchor buttons (بس بيغير dot)
  const prevAnchorKey = useRef(`${anchor?.x}:${anchor?.y}`)
  useEffect(() => {
    const key = `${anchor?.x}:${anchor?.y}`
    if (prevAnchorKey.current === key) return
    prevAnchorKey.current = key
    setDot({ x: anchor?.x ?? 0.5, y: anchor?.y ?? 1 })
  }, [anchor?.x, anchor?.y])

  // ─── القيم المشتقة ───
  // نقطة الـ x/y = مكان الأيقونة
  const xPct = ((iconPos.x / map.w) * 100).toFixed(3)
  const yPct = ((iconPos.y / map.h) * 100).toFixed(3)

  // ─── screen → world ───
  const toWorld = useCallback(
    (clientX, clientY) => {
      const vp = viewportRef?.current
      if (!vp) return { wx: 0, wy: 0 }
      const rect = vp.getBoundingClientRect()
      const st = transformState || { x: 0, y: 0, scale: 1 }
      return {
        wx: (clientX - rect.left - st.x) / Math.max(0.0001, st.scale),
        wy: (clientY - rect.top - st.y) / Math.max(0.0001, st.scale),
      }
    },
    [viewportRef, transformState],
  )

  // ─── log ───
  const log = useCallback(() => {
    const ic = iconRef.current
    const d = dotRef.current
    const xP = Number(((ic.x / map.w) * 100).toFixed(3))
    const yP = Number(((ic.y / map.h) * 100).toFixed(3))

    const out = {
      name: spot?.name,
      id: spot?.id,
      x: xP,
      y: yP,
      anchorX: Number(d.x.toFixed(3)),
      anchorY: Number(d.y.toFixed(3)),
      buildingW: bw,
      buildingH: bh,
    }
    console.log('--- BUILDING PLACEMENT ---')
    Object.entries(out).forEach(([k, v]) => console.log(`${k}:`, v))
    console.log('--------------------------')
    console.log('📋 CMS paste-ready JSON:')
    console.log(JSON.stringify(out, null, 2))
  }, [map.w, map.h, spot?.name, spot?.id, bw, bh])

  // ─── Drag ICON (يحدد x/y) ───
  const onIconDown = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()

      const start = toWorld(e.clientX, e.clientY)
      const grabDx = start.wx - iconRef.current.x
      const grabDy = start.wy - iconRef.current.y

      const onMove = (ev) => {
        const cur = toWorld(ev.clientX, ev.clientY)
        const nx = Math.max(0, Math.min(map.w, cur.wx - grabDx))
        const ny = Math.max(0, Math.min(map.h, cur.wy - grabDy))
        setIconPos({ x: nx, y: ny })

        // المبنى يتبع الأيقونة مع الحفاظ على الـ anchor
        setBoxOrigin({
          x: nx - dotRef.current.x * bw,
          y: ny - dotRef.current.y * bh,
        })
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        log()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [toWorld, map.w, map.h, bw, bh, log],
  )

  // ─── Drag BOX (يحرك المبنى مستقلاً، الأيقونة تتبعه عند anchor) ───
  const onBoxDown = useCallback(
    (e) => {
      if (e.target.dataset.isDot) return
      e.preventDefault()
      e.stopPropagation()

      const start = toWorld(e.clientX, e.clientY)
      const snapDx = start.wx - boxRef.current.x
      const snapDy = start.wy - boxRef.current.y

      const onMove = (ev) => {
        const cur = toWorld(ev.clientX, ev.clientY)
        const nx = Math.max(-bw, Math.min(map.w, cur.wx - snapDx))
        const ny = Math.max(-bh * 0.5, Math.min(map.h, cur.wy - snapDy))
        setBoxOrigin({ x: nx, y: ny })
        // الأيقونة تتبع نقطة الـ anchor داخل الصندوق
        setIconPos({
          x: nx + dotRef.current.x * bw,
          y: ny + dotRef.current.y * bh,
        })
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        log()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [toWorld, map.w, map.h, bw, bh, log],
  )

  // ─── Drag DOT (anchor فقط، الصندوق ثابت، الأيقونة تتحرك) ───
  const onDotDown = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingDot(true)

      const frozenBox = { ...boxRef.current }

      const onMove = (ev) => {
        const { wx, wy } = toWorld(ev.clientX, ev.clientY)
        const nx = clamp01((wx - frozenBox.x) / bw)
        const ny = clamp01((wy - frozenBox.y) / bh)
        setDot({ x: nx, y: ny })
        // الأيقونة تنتقل لنقطة الـ anchor الجديدة
        setIconPos({
          x: frozenBox.x + nx * bw,
          y: frozenBox.y + ny * bh,
        })
      }

      const onUp = () => {
        setIsDraggingDot(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        log()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [toWorld, bw, bh, log],
  )

  return (
    <>
      {/* ─── صندوق المبنى ─── */}
      <div
        onPointerDown={onBoxDown}
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          left: boxOrigin.x,
          top: boxOrigin.y,
          width: bw,
          height: bh,
          border: '2px dashed rgba(255,255,255,0.6)',
          background: isDraggingDot ? 'rgba(0,0,0,0.05)' : 'rgba(149,18,18,0.08)',
          boxSizing: 'border-box',
          cursor: 'grab',
          zIndex: 999,
          overflow: 'visible',
          transition: 'background 0.15s',
        }}
      >
        {/* صورة المبنى — تظهر دايمًا */}
        {spot?.buildingLoopSrc ? (
          <img
            src={spot.buildingLoopSrc}
            alt={spot?.name || 'building'}
            draggable={false}
            decoding="async"
            loading="eager"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              userSelect: 'none',
              pointerEvents: 'none',
              // شفافية خفيفة لما مش بتسحب، تظهر بالكامل لما بتحدد الـ anchor
              opacity: isDraggingDot ? 0.97 : 0.8,
              transition: 'opacity 0.15s',
            }}
          />
        ) : null}

        {/* خطوط التقاطع */}
        <div
          style={{
            position: 'absolute',
            left: dot.x * bw,
            top: 0,
            width: 1,
            height: '100%',
            background: 'rgba(250,204,21,0.5)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: dot.y * bh,
            width: '100%',
            height: 1,
            background: 'rgba(250,204,21,0.5)',
            pointerEvents: 'none',
          }}
        />

        {/* dot الأصفر (anchor) */}
        <div
          data-is-dot="1"
          onPointerDown={onDotDown}
          title="Drag to set anchor point"
          style={{
            position: 'absolute',
            left: dot.x * bw - 9,
            top: dot.y * bh - 9,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: '#facc15',
            border: '2.5px solid rgba(0,0,0,0.65)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            cursor: 'crosshair',
            zIndex: 20,
            pointerEvents: 'auto',
          }}
        />
      </div>

      {/* ─── أيقونة الهوتسبوت (تحدد x/y) ─── */}
      <div
        onPointerDown={onIconDown}
        title="Drag to set hotspot x/y position"
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          left: iconPos.x - ICON_SIZE / 2,
          top: iconPos.y - ICON_SIZE / 2,
          width: ICON_SIZE,
          height: ICON_SIZE,
          zIndex: 1001,
          cursor: 'move',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
        }}
      >
        {/* لو في أيقونة هوتسبوت نعرضها، لو لأ نعرض دائرة بيضاء */}
        {spot?.hotspotIdleSrc ? (
          <img
            src={spot.hotspotIdleSrc}
            alt="hotspot"
            draggable={false}
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        ) : (
          // fallback لو مفيش أيقونة
          <div
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              borderRadius: 999,
              background: '#fff',
              border: '3px solid rgba(250,204,21,0.9)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}
          />
        )}

        {/* خط رابط من الأيقونة لنقطة الـ anchor */}
        <svg
          style={{
            position: 'absolute',
            top: ICON_SIZE / 2,
            left: ICON_SIZE / 2,
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <line
            x1={0}
            y1={0}
            x2={boxOrigin.x + dot.x * bw - iconPos.x}
            y2={boxOrigin.y + dot.y * bh - iconPos.y}
            stroke="rgba(250,204,21,0.6)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        </svg>
      </div>

      {/* ─── HUD ─── */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          left: boxOrigin.x + 4,
          top: boxOrigin.y - 26,
          zIndex: 1002,
          color: '#facc15',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'monospace',
          textShadow: '0 1px 4px rgba(0,0,0,0.95)',
          whiteSpace: 'nowrap',
        }}
      >
        📍 x:{xPct}% y:{yPct}% │ anchorX:{dot.x.toFixed(3)} anchorY:{dot.y.toFixed(3)}
      </div>
    </>
  )
}
