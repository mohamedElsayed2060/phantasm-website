'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent } from 'framer-motion'
import DialogFrame from '@/components/island/DialogFrame'

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

// consistent padding so the bubble never clips
const PAD = 12
const GAP = 5
const BUBBLE_Y_OFFSET_BOTTOM = 35
const BUBBLE_Y_OFFSET_TOP = -100
export default function IntroBubble({
  open,
  title,
  paragraphs = [],
  pageIndex = 0,
  onNext,
  onPrev,
  onClose,
  onShown,

  viewport, // { vw, vh }
  camX, // MotionValue
  camY, // MotionValue
  scale, // MotionValue

  worldX,
  worldY,

  preferredPlacement = 'auto', // 'auto' | 'bottom' | 'top'
  showClose = true,
}) {
  const bubbleRef = useRef(null)

  // rAF throttle
  const rafRef = useRef(0)
  const latestAnchorRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (open) onShown?.()
  }, [open, onShown])

  const safeParagraphs = useMemo(
    () => (Array.isArray(paragraphs) ? paragraphs.filter(Boolean) : []),
    [paragraphs],
  )

  const total = safeParagraphs.length
  const hasPrev = pageIndex > 0
  const hasNext = pageIndex < total - 1

  const [measured, setMeasured] = useState({ w: 0, h: 0 })
  const [screenAnchor, setScreenAnchor] = useState({ x: 0, y: 0 }) // ✅ moves with island (anchor on screen)

  const vw = viewport?.vw || 0
  const vh = viewport?.vh || 0

  const computeAnchor = () => {
    const s = scale?.get?.() ?? 1
    const x = camX?.get?.() ?? 0
    const y = camY?.get?.() ?? 0
    return { x: x + worldX * s, y: y + worldY * s }
  }

  const scheduleAnchorUpdate = () => {
    if (!open) return
    latestAnchorRef.current = computeAnchor()

    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      setScreenAnchor(latestAnchorRef.current)
    })
  }

  // initial anchor when opened / anchor changes
  useEffect(() => {
    if (!open) return
    // ✅ يظهر فورًا
    setScreenAnchor(computeAnchor())
    // ✅ وبعدها يكمل throttled
    scheduleAnchorUpdate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, worldX, worldY])

  // follow camera motion values (throttled)
  useMotionValueEvent(camX, 'change', scheduleAnchorUpdate)
  useMotionValueEvent(camY, 'change', scheduleAnchorUpdate)
  useMotionValueEvent(scale, 'change', scheduleAnchorUpdate)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // measure real size (ResizeObserver)
  useEffect(() => {
    if (!open) return
    const el = bubbleRef.current
    if (!el) return

    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width && r.height) setMeasured({ w: r.width, h: r.height })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, pageIndex, title, total])

  // ✅ Responsive width cap (mobile nearly full width, desktop wider)
  const maxW = useMemo(() => {
    if (!vw) return 520

    // Mobile: قريب من عرض الشاشة (مع padding)
    if (vw < 640) return clamp(vw - PAD * 2, 300, vw - PAD * 2)

    // Tablet: أوسع شوية
    if (vw < 1024) return clamp(vw - PAD * 2, 360, 520)

    // Desktop: زي الفيجما (أكبر من 420)
    return clamp(vw - PAD * 2, 420, 920)
  }, [vw])

  // ✅ Keep width stable (don’t shrink just because content is short)
  const effW = useMemo(() => maxW, [maxW])

  const effH = useMemo(() => measured.h || 160, [measured.h])

  // ✅ Placement decision: above/below based on available space (DYNAMIC with anchor)
  const resolvedPlacement = useMemo(() => {
    if (!vh) return preferredPlacement === 'top' ? 'top' : 'bottom'

    // base choice
    let p = preferredPlacement
    if (p === 'auto') {
      const spaceAbove = screenAnchor.y - PAD
      const spaceBelow = vh - screenAnchor.y - PAD

      if (spaceBelow >= effH + GAP) p = 'bottom'
      else if (spaceAbove >= effH + GAP) p = 'top'
      else p = spaceBelow >= spaceAbove ? 'bottom' : 'top'
    }

    // ensure it actually fits: flip if needed
    const minTop = PAD
    const maxTop = vh - PAD - effH

    const topIfBottom = screenAnchor.y + GAP
    const topIfTop = screenAnchor.y - GAP - effH

    if (p === 'bottom' && topIfBottom > maxTop && topIfTop >= minTop) return 'top'
    if (p === 'top' && topIfTop < minTop && topIfBottom <= maxTop) return 'bottom'

    return p
  }, [preferredPlacement, vh, screenAnchor.y, effH])

  /**
   * ✅ Final position (Pinned in viewport):
   * - center horizontally on anchor then clamp inside viewport
   * - place above/below then clamp inside viewport
   */

  const stylePos = useMemo(() => {
    // X: center on anchor then clamp horizontally
    let left = screenAnchor.x - effW / 2
    if (vw) left = clamp(left, PAD, vw - PAD - effW)

    // Y: force above/below the anchor
    let top = resolvedPlacement === 'bottom' ? screenAnchor.y + GAP : screenAnchor.y - GAP - effH
    top += resolvedPlacement === 'bottom' ? BUBBLE_Y_OFFSET_BOTTOM : BUBBLE_Y_OFFSET_TOP
    if (vh) top = clamp(top, PAD, vh - PAD - effH)

    return { left, top }
  }, [screenAnchor.x, screenAnchor.y, vw, vh, effW, effH, resolvedPlacement])

  // caret X inside bubble (relative to bubble left edge) — points to anchor even when pinned
  const caretX = useMemo(() => {
    const inside = screenAnchor.x - stylePos.left
    return clamp(inside, 24, effW - 24)
  }, [stylePos.left, effW, screenAnchor.x])
  // ✅ Arrow (bubble -> anchor) points
  // ✅ Arrow: pick the correct bubble edge (top/bottom/left/right) depending on where the anchor is
  const arrowIconGeom = useMemo(() => {
    const ax = screenAnchor.x
    const ay = screenAnchor.y

    const left = stylePos.left
    const top = stylePos.top
    const right = left + effW
    const bottom = top + effH

    const cx = left + effW / 2
    const cy = top + effH / 2

    let dx = ax - cx
    let dy = ay - cy

    if (![ax, ay, left, top, right, bottom, cx, cy, dx, dy].every(Number.isFinite)) return null

    // ✅ لو المبنى جوه البابل: خلي الاتجاه افتراضي حسب placement (عشان السهم يفضل ظاهر)
    const isInside = ax >= left && ax <= right && ay >= top && ay <= bottom
    if (isInside) {
      dx = 0
      dy = resolvedPlacement === 'bottom' ? -1 : 1
      // لو البابل تحت المبنى → السهم يطلع لفوق، والعكس
    }

    const len = Math.hypot(dx, dy) || 1
    const ndx = dx / len
    const ndy = dy / len

    // Ray intersection from bubble center to its border
    const adx = Math.abs(ndx)
    const ady = Math.abs(ndy)
    const tx = adx > 0 ? (ndx > 0 ? (right - cx) / ndx : (left - cx) / ndx) : Infinity
    const ty = ady > 0 ? (ndy > 0 ? (bottom - cy) / ndy : (top - cy) / ndy) : Infinity
    const t = Math.min(tx, ty)

    // Edge point
    let x = cx + ndx * t
    let y = cy + ndy * t

    // Push outside a bit so it's attached to bubble, not on the building
    const pushOut = 20
    x += ndx * pushOut
    y += ndy * pushOut

    // Angle toward the building (degrees)
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + -90

    return { x, y, angle }
  }, [screenAnchor.x, screenAnchor.y, stylePos.left, stylePos.top, effW, effH, resolvedPlacement])

  return (
    <AnimatePresence>
      {open && total > 0 ? (
        <>
          {/* ✅ Arrow overlay (always on, points exactly, rotates automatically) */}
          <svg className="fixed inset-0 z-[70] pointer-events-none" width="100%" height="100%">
            <defs>
              <filter id="arrowShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
              </filter>
            </defs>

            {arrowIconGeom ? (
              <g
                filter="url(#arrowShadow)"
                transform={`
                  translate(${arrowIconGeom.x} ${arrowIconGeom.y})
                  rotate(${arrowIconGeom.angle})
                  translate(-9 -10.5)
                `}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                {/* ✅ Your SVG */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="21"
                  viewBox="0 0 18 21"
                  fill="none"
                >
                  <path
                    d="M0.996581 11.7612L15.9966 11.7612L15.9966 4.76123L0.996581 4.76123L0.996581 11.7612Z"
                    fill="white"
                  />
                  <path
                    d="M1.02246 9.76123L14.0225 9.76123L14.0225 2.76123L1.02246 2.76123L1.02246 9.76123Z"
                    fill="white"
                  />
                  <path
                    d="M1.02246 2.76123L5.02246 2.76123L5.02246 0.761231L1.02246 0.76123L1.02246 2.76123Z"
                    fill="white"
                  />
                  <path
                    d="M1.02246 13.7612L13.0225 13.7612L13.0225 6.76123L1.02246 6.76123L1.02246 13.7612Z"
                    fill="white"
                  />
                  <path
                    d="M9.02246 19.7612L14.0225 19.7612L14.0225 12.7612L9.02246 12.7612L9.02246 19.7612Z"
                    fill="white"
                  />
                  <path
                    d="M-3.57628e-07 12.7612L1 12.7612L1 4.76123L-1.03336e-07 4.76123L-3.57628e-07 12.7612Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M2.16733 2.99869L12.8776 2.99869L12.8776 3.99606L13.9535 3.99606L13.9535 2.99869L15.0225 2.99869L15.0225 4.76837e-07L0.0224601 0L0.02246 2.99869L1.09138 2.99869L1.09138 5L2.16733 5L2.16733 2.99869ZM2.16733 0.997376L4.30516 0.997376L4.30516 2.00131L2.16733 2.00131L2.16733 0.997376Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M0.970585 13.8062L2.02246 13.8062L2.02246 12.7612L0.970585 12.7612L0.970585 13.8062Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M3.7841 12.3357L4.8291 12.3357L4.8291 9.18694L3.7841 9.18694L3.7841 12.3357Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M1.93246 14.8062L4.02246 14.8062L4.02246 13.7612L1.93246 13.7612L1.93246 14.8062Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M6.9257 12.3357L7.9707 12.3357L7.9707 9.18694L6.9257 9.18694L6.9257 12.3357Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M10.0678 12.3357L11.1196 12.3357L11.1196 9.18694L10.0678 9.18694L10.0678 12.3357Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M10.0225 14.7612L4.02246 14.7612L4.02246 15.7645L9.01918 15.7645L9.01918 19.7612L10.0225 19.7612L10.0225 14.7612Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M10.0225 13.7612L4.02246 13.7612L4.02246 14.7645L9.01918 14.7645L9.01918 18.7612L10.0225 18.7612L10.0225 13.7612Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M10.0225 20.7612L13.0225 20.7612L13.0225 19.7612L10.0225 19.7612L10.0225 20.7612Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M13.9774 7.76123L12.9741 7.76123L12.9741 19.7612L13.9774 19.7612L13.9774 12.7607L14.9741 12.7607L14.9741 11.7634L13.9774 11.7634L13.9774 7.76123Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M13.9775 4.81299L15.0225 4.81299L15.0225 3.76111L13.9775 3.76111L13.9775 4.81299Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M14.9775 6.85815L16.0225 6.85815L16.0225 4.76128L14.9775 4.76128L14.9775 6.85815Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M14.9775 11.813L16.0225 11.813L16.0225 10.7611L14.9775 10.7611L14.9775 11.813Z"
                    fill="#2A1616"
                  />
                  <path
                    d="M15.9706 10.948L17.0225 10.948L17.0225 6.76112L15.9706 6.76112L15.9706 10.948Z"
                    fill="#2A1616"
                  />
                </svg>
              </g>
            ) : null}
          </svg>

          {/* ✅ Bubble */}
          <motion.div
            data-overlay="1"
            className="pointer-events-auto absolute z-[60]"
            style={{
              left: stylePos.left,
              top: stylePos.top,
              width: effW,
              maxWidth: effW,
            }}
            initial={{ opacity: 0, y: resolvedPlacement === 'bottom' ? 10 : -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: resolvedPlacement === 'bottom' ? 10 : -10, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.19, 1, 0.22, 1] }}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={bubbleRef} data-overlay="1" className="relative " style={{ width: '100%' }}>
              <DialogFrame
                title={title || 'Intro Dialog'}
                subtitle={`${pageIndex + 1}/${total}`}
                showClose={showClose} // لو عندك prop
                onClose={() => onClose?.()}
                avatarPanelBg="/ui/dialog/avatar-panel.png" // هتغيرهم بعدين
                textPanelBg="/ui/dialog/text-panel.png"
              >
                <div className="whitespace-pre-line">{safeParagraphs[pageIndex]}</div>

                <div className="mt-4 flex items-center justify-between">
                  {hasPrev && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPrev?.()
                      }}
                      disabled={!hasPrev}
                      className={`h-9 px-3 rounded-full border text-[12px] ${
                        hasPrev
                          ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white/90'
                          : 'border-white/10 bg-white/5 text-white/35 cursor-not-allowed'
                      }`}
                    >
                      Prev
                    </button>
                  )}
                  {hasNext && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNext?.()
                      }}
                      disabled={!hasNext}
                      className={`h-9 px-4 rounded-full border text-[12px] ${
                        hasNext
                          ? 'border-white/15 bg-white/10 hover:bg-white/15 text-white/90'
                          : 'border-white/10 bg-white/5 text-white/35 cursor-not-allowed'
                      }`}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </DialogFrame>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
