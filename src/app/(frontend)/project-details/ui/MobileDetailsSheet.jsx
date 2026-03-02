'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import ProjectDetailsScrollPanel from './ProjectDetailsScrollPanel'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

export default function MobileDetailsSheet({ project, anchorRef }) {
  const [ready, setReady] = useState(false)
  const isExpandedRef = useRef(false)
  const didDragRef = useRef(false)
  const topVal = useMotionValue(0)
  const snapsRef = useRef({ collapsedTop: 0, expandedTop: 0, panelMaxH: 0, vh: 0 })
  const sheetRef = useRef(null)
  const innerScrollRef = useRef(null)

  const compute = useCallback(() => {
    const vh = window.innerHeight
    const rect = anchorRef?.current?.getBoundingClientRect?.()
    const mediaBottom = rect?.bottom ?? Math.round(vh * 0.44)
    const collapsedTop = clamp(mediaBottom, 100, vh - 80)
    const TOP_PEEK = 72
    const expandedTop = clamp(TOP_PEEK, 60, collapsedTop - 160)
    const panelMaxH = Math.max(200, vh - expandedTop - 28 - 24)
    snapsRef.current = { collapsedTop, expandedTop, panelMaxH, vh }
    return snapsRef.current
  }, [anchorRef])

  useLayoutEffect(() => {
    const apply = () => {
      const { collapsedTop, expandedTop } = compute()
      topVal.set(isExpandedRef.current ? expandedTop : collapsedTop)
      setReady(true)
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [compute, topVal])

  useEffect(() => {
    if (!ready) return
    const { collapsedTop, vh } = snapsRef.current
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

  // ── Handle bar drag ──
  const handleDragRef = useRef({ active: false, startY: 0, startTop: 0 })

  const onHandlePointerDown = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      didDragRef.current = false
      handleDragRef.current = { active: true, startY: e.clientY, startTop: topVal.get() }

      const onMove = (ev) => {
        if (!handleDragRef.current.active) return
        ev.preventDefault()
        const { expandedTop, collapsedTop } = snapsRef.current
        const dy = ev.clientY - handleDragRef.current.startY
        if (Math.abs(dy) > 6) didDragRef.current = true
        topVal.set(clamp(handleDragRef.current.startTop + dy, expandedTop, collapsedTop))
      }

      const onUp = () => {
        if (!handleDragRef.current.active) return
        handleDragRef.current.active = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        const { expandedTop, collapsedTop } = snapsRef.current
        const cur = topVal.get()
        const mid = (expandedTop + collapsedTop) / 2
        if (cur <= mid) snapTo(expandedTop, true)
        else snapTo(collapsedTop, false)
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

  const onHandleTap = useCallback(() => {
    if (didDragRef.current) return
    const { expandedTop, collapsedTop } = snapsRef.current
    if (!isExpandedRef.current) snapTo(expandedTop, true)
    else snapTo(collapsedTop, false)
  }, [])

  // ── Sheet touch listeners ──
  // السر: بنحدد نوع الـ gesture في touchstart نفسه
  // ولو هو sheet gesture بنضيف touchmove بـ passive:false في touchstart
  // ولو مش sheet gesture مش بنضيفه خالص → مفيش warning
  useEffect(() => {
    if (!ready) return
    const el = sheetRef.current
    if (!el) return

    const state = {
      startY: 0,
      startTop: 0,
      isSheetGesture: false,
      moveFn: null,
      endFn: null,
    }

    const cleanup = () => {
      if (state.moveFn) el.removeEventListener('touchmove', state.moveFn)
      if (state.endFn) {
        el.removeEventListener('touchend', state.endFn)
        el.removeEventListener('touchcancel', state.endFn)
      }
      state.moveFn = null
      state.endFn = null
    }

    const onTouchStart = (e) => {
      cleanup()

      const scrollTop = innerScrollRef.current?.scrollTop ?? 0
      const atTop = scrollTop <= 2
      const startY = e.touches[0].clientY

      // هنحدد هل ممكن يبقى sheet gesture
      // مش هنعرف الاتجاه غير في touchmove، بس هنحدد الحالات الممكنة
      const couldBeSheet =
        !isExpandedRef.current || // مقفول → أي سحب لفوق ممكن يفتح
        (isExpandedRef.current && atTop) // مفتوح والـ scroll في الأعلى → ممكن يقفل

      if (!couldBeSheet) return // مش هنتدخل خالص

      state.startY = startY
      state.startTop = topVal.get()
      state.isSheetGesture = false

      // بنضيف touchmove بـ passive:false هنا بس لما يكون ممكن يبقى sheet gesture
      const onMove = (ev) => {
        const dy = ev.touches[0].clientY - state.startY

        if (!state.isSheetGesture) {
          // أول حركة كبيرة نحدد
          if (Math.abs(dy) < 8) return

          const goingUp = dy < 0
          const goingDown = dy > 0

          if (goingUp && !isExpandedRef.current) {
            state.isSheetGesture = true
          } else if (goingDown && isExpandedRef.current) {
            state.isSheetGesture = true
          } else {
            // مش sheet gesture → نشيل الـ listener ونسيب الـ scroll
            cleanup()
            return
          }
        }

        // sheet gesture مؤكد
        ev.preventDefault()
        const { expandedTop, collapsedTop } = snapsRef.current
        topVal.set(clamp(state.startTop + dy, expandedTop, collapsedTop))
      }

      const onEnd = () => {
        cleanup()
        if (!state.isSheetGesture) return
        const { expandedTop, collapsedTop } = snapsRef.current
        const cur = topVal.get()
        const mid = (expandedTop + collapsedTop) / 2
        if (cur <= mid) snapTo(expandedTop, true)
        else snapTo(collapsedTop, false)
      }

      state.moveFn = onMove
      state.endFn = onEnd

      // passive:false هنا عشان نقدر نعمل preventDefault لو اتأكدنا إنه sheet gesture
      el.addEventListener('touchmove', onMove, { passive: false })
      el.addEventListener('touchend', onEnd, { passive: true })
      el.addEventListener('touchcancel', onEnd, { passive: true })
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      cleanup()
    }
  }, [ready, topVal])
  // ── Wheel / Trackpad (Desktop) ──
  useEffect(() => {
    if (!ready) return
    const el = sheetRef.current
    if (!el) return

    const onWheel = (e) => {
      const sc = innerScrollRef.current
      const scrollTop = sc?.scrollTop ?? 0
      const atTop = scrollTop <= 2
      const { expandedTop, collapsedTop } = snapsRef.current
      if (!isExpandedRef.current && e.deltaY > 0) {
        e.preventDefault()
        snapTo(expandedTop, true)
        return
      }
      if (isExpandedRef.current && atTop && e.deltaY < 0) {
        e.preventDefault()
        snapTo(collapsedTop, false)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [ready])
  if (!ready) return null
  const { panelMaxH } = snapsRef.current

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      <motion.div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 pointer-events-auto"
        style={{ top: topVal }}
      >
        {/* Handle */}
        <div
          className="flex justify-center items-center w-full pt-2 pb-2 select-none relative z-20"
          style={{ touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onHandlePointerDown}
          onClick={onHandleTap}
        >
          <div className="h-1 w-14 rounded-full bg-[#2B1A1A]" />
        </div>

        {/* Content */}
        <div className="px-3 pb-3">
          <ProjectDetailsScrollPanel
            project={project}
            maxHeightPx={panelMaxH}
            innerScrollRef={innerScrollRef}
          />
        </div>
      </motion.div>
    </div>
  )
}
