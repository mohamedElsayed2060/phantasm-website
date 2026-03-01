'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import ProjectDetailsScrollPanel from './ProjectDetailsScrollPanel'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function MobileDetailsSheet({ project, anchorRef }) {
  const [ready, setReady] = useState(false)

  // هل الشيت مفتوح ولا مقفول (للحفاظ على الحالة وقت resize/rotation)
  const isExpandedRef = useRef(false)

  // منع الـ click toggle بعد drag
  const didDragRef = useRef(false)

  // top position (px)
  const topVal = useMotionValue(0)

  const snapsRef = useRef({ collapsedTop: 0, expandedTop: 0, panelMaxH: 0, vh: 0 })

  // pointer drag state
  const dragRef = useRef({ active: false, startY: 0, startTop: 0 })

  const compute = useCallback(() => {
    const vh = window.innerHeight
    const rect = anchorRef?.current?.getBoundingClientRect?.()
    const mediaBottom = rect?.bottom ?? Math.round(vh * 0.44)

    // ✅ زي ما طلبت: من غير GAP / من غير تعديل على collapsedTop
    const collapsedTop = clamp(mediaBottom, 100, vh - 80)

    const TOP_PEEK = 72
    const expandedTop = clamp(TOP_PEEK, 60, collapsedTop - 160)

    const HANDLE_H = 28
    const PADDING = 24
    const panelMaxH = Math.max(200, vh - expandedTop - HANDLE_H - PADDING)

    snapsRef.current = { collapsedTop, expandedTop, panelMaxH, vh }
    return snapsRef.current
  }, [anchorRef])

  useLayoutEffect(() => {
    const apply = () => {
      const { collapsedTop, expandedTop } = compute()

      // ✅ حافظ على نفس الحالة وقت resize
      topVal.set(isExpandedRef.current ? expandedTop : collapsedTop)

      setReady(true)
    }

    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [compute, topVal])

  // Entrance animation
  useEffect(() => {
    if (!ready) return
    const { collapsedTop, vh } = snapsRef.current

    // يبدأ من تحت الشاشة ثم يطلع للـ collapsed
    topVal.set(vh + 40)

    const t = setTimeout(() => {
      animate(topVal, collapsedTop, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
      isExpandedRef.current = false
    }, 120)

    return () => clearTimeout(t)
  }, [ready, topVal])

  const snapTo = (to, expanded) => {
    animate(topVal, to, { duration: 0.28, ease: [0.22, 1, 0.36, 1] })
    isExpandedRef.current = expanded
  }

  // ── Manual pointer drag (avoids Framer drag conflicting with CSS top) ──
  const onPointerDown = useCallback(
    (e) => {
      e.preventDefault()

      // reset
      didDragRef.current = false

      dragRef.current = {
        active: true,
        startY: e.clientY,
        startTop: topVal.get(),
      }

      const onMove = (ev) => {
        if (!dragRef.current.active) return
        ev.preventDefault()

        const { expandedTop, collapsedTop } = snapsRef.current
        const dy = ev.clientY - dragRef.current.startY

        if (Math.abs(dy) > 6) didDragRef.current = true

        const next = clamp(dragRef.current.startTop + dy, expandedTop, collapsedTop)
        topVal.set(next)
      }

      const onUp = () => {
        if (!dragRef.current.active) return
        dragRef.current.active = false

        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)

        const { expandedTop, collapsedTop } = snapsRef.current
        const cur = topVal.get()
        const mid = (expandedTop + collapsedTop) / 2

        if (cur <= mid) snapTo(expandedTop, true)
        else snapTo(collapsedTop, false)

        // ✅ افصل drag عن click (لمنع toggle بعد السحب)
        setTimeout(() => {
          didDragRef.current = false
        }, 0)
      }

      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [topVal],
  )

  // tap = toggle (لكن مش بعد drag)
  const onTap = useCallback(() => {
    if (didDragRef.current) return

    const { expandedTop, collapsedTop } = snapsRef.current
    if (!isExpandedRef.current) snapTo(expandedTop, true)
    else snapTo(collapsedTop, false)
  }, [])

  if (!ready) return null
  const { panelMaxH } = snapsRef.current

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <motion.div
        className="absolute left-0 right-0 bottom-0 pointer-events-auto"
        style={{ top: topVal }}
      >
        {/* Handle — drag + tap */}
        <div
          className="flex justify-center items-center w-full pt-2 pb-2 select-none relative z-20"
          style={{ touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onPointerDown}
          onClick={onTap}
        >
          <div className="h-1 w-14 rounded-full bg-[#2B1A1A]" />
        </div>

        {/* Scrollable content panel */}
        <div className="px-3 pb-3">
          <ProjectDetailsScrollPanel project={project} maxHeightPx={panelMaxH} />
        </div>
      </motion.div>
    </div>
  )
}
