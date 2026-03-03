'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'

const clamp01 = (v) => Math.max(0, Math.min(1, v))

export default function DebugBuildingPlacer({
  map,
  spot,
  pos, // world position of the hotspot dot (x%, y% converted to px by parent)
  setPos, // used ONLY to move the box via drag
  anchor, // preset anchor from parent buttons { x, y }
  viewportRef,
  transformState,
}) {
  const bw = Number(spot?.buildingW || 240)
  const bh = Number(spot?.buildingH || 240)

  // ─── مصدر الحقيقة الوحيد ───
  // boxOrigin = ركن الصندوق الأيسر العلوي في world space
  // نحسبه مرة واحدة من pos + anchor الأولي
  const [boxOrigin, setBoxOrigin] = useState(() => ({
    x: pos.worldX - (anchor?.x ?? 0.5) * bw,
    y: pos.worldY - (anchor?.y ?? 1) * bh,
  }))

  // dot = النسبة (0-1) داخل الصندوق — مستقل تمامًا عن boxOrigin
  const [dot, setDot] = useState({ x: anchor?.x ?? 0.5, y: anchor?.y ?? 1 })

  // refs للـ log (حل stale closure)
  const boxRef = useRef(boxOrigin)
  const dotRef = useRef(dot)
  useEffect(() => {
    boxRef.current = boxOrigin
  }, [boxOrigin])
  useEffect(() => {
    dotRef.current = dot
  }, [dot])

  // sync preset anchor buttons من parent (بس بيغير dot، مش boxOrigin)
  const prevAnchorKey = useRef(`${anchor?.x}:${anchor?.y}`)
  useEffect(() => {
    const key = `${anchor?.x}:${anchor?.y}`
    if (prevAnchorKey.current === key) return
    prevAnchorKey.current = key
    setDot({ x: anchor?.x ?? 0.5, y: anchor?.y ?? 1 })
  }, [anchor?.x, anchor?.y])

  // ─── القيم المشتقة ───
  // anchor point في العالم = boxOrigin + dot * size
  const anchorWorldX = boxOrigin.x + dot.x * bw
  const anchorWorldY = boxOrigin.y + dot.y * bh

  const xPct = ((anchorWorldX / map.w) * 100).toFixed(3)
  const yPct = ((anchorWorldY / map.h) * 100).toFixed(3)

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

  // ─── log (يقرأ من refs دايمًا) ───
  const log = useCallback(() => {
    const b = boxRef.current
    const d = dotRef.current
    const ax = b.x + d.x * bw
    const ay = b.y + d.y * bh
    const xP = Number(((ax / map.w) * 100).toFixed(3))
    const yP = Number(((ay / map.h) * 100).toFixed(3))

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

  // ─── Drag BOX — يحرك boxOrigin بس، dot ماتغيرش ───
  const onBoxDown = useCallback(
    (e) => {
      if (e.target.dataset.isDot) return // لو الضغطة على الـ dot، وديها للـ dot handler
      e.preventDefault()
      e.stopPropagation()

      const start = toWorld(e.clientX, e.clientY)
      const snapDx = start.wx - boxRef.current.x
      const snapDy = start.wy - boxRef.current.y

      const onMove = (ev) => {
        const cur = toWorld(ev.clientX, ev.clientY)
        setBoxOrigin({
          x: Math.max(-bw, Math.min(map.w, cur.wx - snapDx)),
          y: Math.max(-bh * 0.5, Math.min(map.h, cur.wy - snapDy)),
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

  // ─── Drag DOT — يغير dot بس، boxOrigin ماتحركش ───
  const onDotDown = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()

      // نلتقط boxOrigin في لحظة البدء ونخليه ثابت طول السحب
      const frozenBox = { ...boxRef.current }

      const onMove = (ev) => {
        const { wx, wy } = toWorld(ev.clientX, ev.clientY)
        // المؤشر نسبةً لركن الصندوق الثابت
        setDot({
          x: clamp01((wx - frozenBox.x) / bw),
          y: clamp01((wy - frozenBox.y) / bh),
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
    [toWorld, bw, bh, log],
  )

  return (
    <>
      {/* ─── ghost box ─── */}
      <div
        onPointerDown={onBoxDown}
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          left: boxOrigin.x,
          top: boxOrigin.y,
          width: bw,
          height: bh,
          border: '2px dashed rgba(255,255,255,0.85)',
          background: 'rgba(149,18,18,0.10)',
          boxSizing: 'border-box',
          cursor: 'grab',
          zIndex: 999,
          overflow: 'visible',
        }}
      >
        {/* building preview */}
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
              opacity: 0.95,
            }}
          />
        ) : null}

        {/* crosshair lines */}
        <div
          style={{
            position: 'absolute',
            left: dot.x * bw,
            top: 0,
            width: 1,
            height: '100%',
            background: 'rgba(250,204,21,0.4)',
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
            background: 'rgba(250,204,21,0.4)',
            pointerEvents: 'none',
          }}
        />

        {/* draggable anchor dot */}
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

      {/* ─── HUD ─── */}
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          left: boxOrigin.x + 4,
          top: boxOrigin.y - 24,
          zIndex: 1000,
          color: '#facc15',
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'monospace',
          textShadow: '0 1px 4px rgba(0,0,0,0.95)',
          whiteSpace: 'nowrap',
        }}
      >
        x:{xPct}% y:{yPct}% │ anchorX:{dot.x.toFixed(3)} anchorY:{dot.y.toFixed(3)}
      </div>
    </>
  )
}
