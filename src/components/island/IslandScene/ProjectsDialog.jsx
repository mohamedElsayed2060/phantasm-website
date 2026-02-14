'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent } from 'framer-motion'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const PAD = 12
const GAP = 14

function pickThumb(p) {
  return (
    p?.thumbSrc ||
    p?.thumb?.url ||
    p?.thumb?.sizes?.medium?.url ||
    p?.thumb?.sizes?.small?.url ||
    p?.thumb?.thumbnailURL ||
    null
  )
}

export default function ProjectsDialog({
  open,
  spot,
  onClose,

  // positioning (same pattern as IntroBubble)
  viewport, // { vw, vh }
  camX, // MotionValue
  camY, // MotionValue
  scale, // MotionValue
  worldX,
  worldY,
  onShown,
  preferredPlacement = 'auto', // 'auto' | 'right' | 'left'
  onCheckItOut, // optional: (project) => void
}) {
  const wrapRef = useRef(null)
  useEffect(() => {
    if (open) onShown?.()
  }, [open, onShown])
  const projects = useMemo(() => {
    const arr = Array.isArray(spot?.projects) ? spot.projects : []
    // sort by order then createdAt fallback
    return [...arr].sort((a, b) => {
      const ao = Number(a?.order ?? 9999)
      const bo = Number(b?.order ?? 9999)
      if (ao !== bo) return ao - bo
      return String(a?.createdAt || '').localeCompare(String(b?.createdAt || ''))
    })
  }, [spot])

  const [activeId, setActiveId] = useState(null)
  const activeProject = useMemo(() => {
    if (!projects.length) return null
    return projects.find((p) => p.id === activeId) || projects[0]
  }, [projects, activeId])

  // reset selection when opening/spot changes
  useEffect(() => {
    if (!open) return
    setActiveId(projects?.[0]?.id || null)
  }, [open, spot?.id, projects])

  const [measured, setMeasured] = useState({ w: 0, h: 0 })
  const [screenAnchor, setScreenAnchor] = useState({ x: 0, y: 0 })

  const vw = viewport?.vw || 0
  const vh = viewport?.vh || 0
  const isMobile = vw > 0 ? vw < 640 : false

  const computeAnchor = () => {
    const s = scale?.get?.() ?? 1
    const x = camX?.get?.() ?? 0
    const y = camY?.get?.() ?? 0
    return { x: x + worldX * s, y: y + worldY * s }
  }

  // init anchor
  useEffect(() => {
    if (!open) return
    setScreenAnchor(computeAnchor())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, worldX, worldY])

  // follow camera motion
  useMotionValueEvent(camX, 'change', () => {
    if (!open) return
    setScreenAnchor(computeAnchor())
  })
  useMotionValueEvent(camY, 'change', () => {
    if (!open) return
    setScreenAnchor(computeAnchor())
  })
  useMotionValueEvent(scale, 'change', () => {
    if (!open) return
    setScreenAnchor(computeAnchor())
  })

  // measure dialog (ResizeObserver)
  useEffect(() => {
    if (!open) return
    const el = wrapRef.current
    if (!el) return

    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width && r.height) setMeasured({ w: r.width, h: r.height })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, projects.length, activeId])

  // target size like the mock
  const targetW = useMemo(() => {
    if (!vw) return 720
    if (isMobile) return clamp(vw - PAD * 2, 280, 520)
    return clamp(vw * 0.72, 620, 840)
  }, [vw, isMobile])

  const targetH = useMemo(() => {
    if (!vh) return 320
    if (isMobile) return clamp(vh * 0.62, 260, 520)
    return clamp(vh * 0.44, 280, 380)
  }, [vh, isMobile])

  // effective (after measure)
  const effW = useMemo(() => Math.min(measured.w || targetW, targetW), [measured.w, targetW])
  const effH = useMemo(() => Math.min(measured.h || targetH, targetH), [measured.h, targetH])

  // decide side placement (right/left) + clamp
  const side = useMemo(() => {
    if (!vw) return preferredPlacement === 'left' ? 'left' : 'right'
    if (isMobile) return 'center'

    if (preferredPlacement === 'left') return 'left'
    if (preferredPlacement === 'right') return 'right'

    const spaceRight = vw - screenAnchor.x - PAD
    const spaceLeft = screenAnchor.x - PAD

    // prefer right if it fits, else left, else whichever has more room
    if (spaceRight >= effW + GAP) return 'right'
    if (spaceLeft >= effW + GAP) return 'left'
    return spaceRight >= spaceLeft ? 'right' : 'left'
  }, [preferredPlacement, vw, screenAnchor.x, effW, isMobile])

  const stylePos = useMemo(() => {
    if (!vw || !vh) return { left: 0, top: 0 }

    // Mobile: centered-ish (like a compact modal)
    if (isMobile) {
      const left = clamp(vw / 2 - effW / 2, PAD, vw - PAD - effW)
      const top = clamp(vh * 0.22, PAD, vh - PAD - effH)
      return { left, top }
    }

    // Desktop: place to the side of anchor, vertically centered-ish
    let left = side === 'right' ? screenAnchor.x + GAP : screenAnchor.x - GAP - effW

    let top = screenAnchor.y - effH * 0.32

    left = clamp(left, PAD, vw - PAD - effW)
    top = clamp(top, PAD, vh - PAD - effH)

    return { left, top }
  }, [vw, vh, effW, effH, isMobile, side, screenAnchor.x, screenAnchor.y])

  const handleCheck = () => {
    if (!activeProject) return
    if (onCheckItOut) return onCheckItOut(activeProject)
    // fallback: you can wire routing in IslandScene or parent
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-auto absolute z-[80]"
          style={{
            left: stylePos.left,
            top: stylePos.top,
            width: targetW,
            height: targetH,
            maxWidth: targetW,
            maxHeight: targetH,
          }}
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={wrapRef}
            className="relative w-full h-full rounded-[10px] overflow-hidden border border-black/70 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            style={{
              // closer to your mock (dark frame)
              background: 'rgba(20, 6, 6, 0.92)',
            }}
          >
            {/* Close (top-right red square like mock) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClose?.()
              }}
              className="absolute top-1.5 right-1.5 z-10 w-6 h-6 grid place-items-center"
              style={{ background: '#8f1010', border: '2px solid #e6c7c7' }}
              aria-label="Close"
            >
              <span className="text-white text-[14px] leading-none">×</span>
            </button>

            {/* Content grid */}
            <div
              className={`w-full h-full ${isMobile ? 'flex flex-col' : 'grid'}`}
              style={!isMobile ? { gridTemplateColumns: '200px 1fr' } : undefined}
            >
              {/* Left list */}
              <div
                className={`p-3 ${isMobile ? 'border-b border-white/10' : 'border-r border-white/10'}`}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-white/70 mb-2">
                  {spot?.label || 'Projects'}
                </div>

                <div
                  className="space-y-2"
                  style={{
                    maxHeight: isMobile ? 140 : 'calc(100% - 18px)',
                    overflow: 'auto',
                  }}
                >
                  {projects.length ? (
                    projects.map((p) => {
                      const active = (activeProject?.id || null) === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActiveId(p.id)}
                          className="w-full text-left px-3 py-2 rounded-[4px] border"
                          style={{
                            background: active ? '#8f1010' : 'rgba(0,0,0,0.35)',
                            borderColor: active ? '#f2d1d1' : 'rgba(255,255,255,0.18)',
                          }}
                        >
                          <div className="text-[11px] font-semibold text-white leading-tight">
                            {(p.title || 'Untitled').toUpperCase()}
                          </div>
                          {p.tag ? (
                            <div className="mt-0.5 text-[10px] text-white/70">{p.tag}</div>
                          ) : null}
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-[12px] text-white/60">No projects yet.</div>
                  )}
                </div>
              </div>

              {/* Right details */}
              <div className="p-3 h-full">
                {!activeProject ? (
                  <div className="text-white/70 text-sm">Pick a project.</div>
                ) : (
                  <div
                    className={`h-full ${isMobile ? 'flex flex-col' : 'grid'}`}
                    style={!isMobile ? { gridTemplateColumns: '1fr 220px', gap: 12 } : undefined}
                  >
                    {/* Text block */}
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-white tracking-[0.14em] uppercase">
                        {activeProject.title || 'Project'}
                      </div>

                      <div
                        className="mt-2 text-[11px] leading-relaxed text-white/80"
                        style={{
                          maxHeight: isMobile ? 120 : 150,
                          overflow: 'auto',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {activeProject.shortDescription || '—'}
                      </div>

                      <button
                        type="button"
                        onClick={handleCheck}
                        className="mt-3 inline-flex items-center justify-center h-8 px-4 rounded-[4px] border text-[11px] font-semibold tracking-[0.14em] uppercase"
                        style={{
                          background: '#8f1010',
                          borderColor: '#f2d1d1',
                          color: 'white',
                        }}
                      >
                        Check it out
                      </button>
                    </div>

                    {/* Image block */}
                    <div
                      className="rounded-[4px] overflow-hidden border"
                      style={{
                        background: 'rgba(255,255,255,0.92)',
                        borderColor: 'rgba(0,0,0,0.55)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      {pickThumb(activeProject) ? (
                        <img
                          src={pickThumb(activeProject)}
                          alt={activeProject?.thumb?.alt || activeProject.title || 'Project'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          draggable={false}
                        />
                      ) : (
                        <div className="text-[11px] text-black/60 p-3 text-center">No image</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
