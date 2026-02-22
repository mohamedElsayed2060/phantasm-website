'use client'

import React, { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectsPopover from './ProjectsPopover'
import BuildingPointer from './BuildingPointer'
import ProjectDetailsPanel from './ProjectDetailsPanel'
import ProjectDialogPanel from './ProjectDialogPanel'
import { clampToViewportX } from '../utils'
import useLockIslandGestures from '@/components/overlays/useLockIslandGestures'

const POPOVER_W = 360
const POPOVER_H = 170
const GAP = 5
const MARGIN = 14
const DETAILS_W = 560 // لازم يطابق ستايل Panel اللي عندك (أنت عامل 560 على الديسكتوب)

function isMobile(viewW) {
  return viewW < 768
}

const clamp = (n, min, max) => Math.max(min, Math.min(n, max))

function getPopoverDims(viewW, viewH, overlayPopW) {
  const w = overlayPopW || Math.min(POPOVER_W, viewW - 24)
  const h = POPOVER_H
  return { w, h }
}

/**
 * ✅ اختيار placement آمن + clamp للـ popover بحيث يفضل جوه الشاشة
 * - يحاول يلتزم بالـ preferred (overlay.placement) لو ينفع
 * - لو مفيش مساحة، يقلب لمكان تاني
 * - في الآخر يعمل clamp نهائي
 */
function computeDockPosition({ preferredPlacement, anchorX, anchorY, popW, popH, vw, vh }) {
  const margin = MARGIN
  const gap = GAP

  // candidates بترتيب: preferred ثم باقي الأماكن
  const order = (() => {
    const all = ['top', 'bottom', 'right', 'left']
    const pref = preferredPlacement && all.includes(preferredPlacement) ? preferredPlacement : 'top'
    return [pref, ...all.filter((x) => x !== pref)]
  })()

  const make = (placement) => {
    // dockStyle will use transforms:
    // top: translate(-50%, -100%)  => left=anchorX, top=anchorY-gap
    // bottom: translate(-50%, 0%)  => left=anchorX, top=anchorY+gap
    // right: translate(0%, -50%)   => left=anchorX+gap, top=anchorY
    // left: translate(-100%, -50%) => left=anchorX-gap, top=anchorY
    if (placement === 'top') {
      return { placement, left: anchorX, top: anchorY - gap }
    }
    if (placement === 'bottom') {
      return { placement, left: anchorX, top: anchorY + gap }
    }
    if (placement === 'right') {
      return { placement, left: anchorX + gap, top: anchorY }
    }
    return { placement: 'left', left: anchorX - gap, top: anchorY }
  }

  const fits = (placement, left, top) => {
    // نحسب الـ rect النهائي بعد transform لكل placement
    let rectLeft = 0
    let rectTop = 0

    if (placement === 'top') {
      rectLeft = left - popW / 2
      rectTop = top - popH
    } else if (placement === 'bottom') {
      rectLeft = left - popW / 2
      rectTop = top
    } else if (placement === 'right') {
      rectLeft = left
      rectTop = top - popH / 2
    } else {
      rectLeft = left - popW
      rectTop = top - popH / 2
    }

    const rectRight = rectLeft + popW
    const rectBottom = rectTop + popH

    return (
      rectLeft >= margin &&
      rectTop >= margin &&
      rectRight <= vw - margin &&
      rectBottom <= vh - margin
    )
  }

  // 1) اختار أول placement يfit بالكامل
  let chosen = null
  for (const pl of order) {
    const p = make(pl)
    if (fits(p.placement, p.left, p.top)) {
      chosen = p
      break
    }
  }

  // 2) لو مفيش ولا واحد fit بالكامل، خذ preferred واعمل clamp قوي
  if (!chosen) chosen = make(order[0])

  // 3) clamp نهائي لمكان الـ rect بحيث يفضل جوه viewport
  // نحول (dock left/top + transform) إلى rect، نعمل clamp، ثم نرجّع dock left/top تاني
  let rectLeft = 0
  let rectTop = 0

  if (chosen.placement === 'top') {
    rectLeft = chosen.left - popW / 2
    rectTop = chosen.top - popH
  } else if (chosen.placement === 'bottom') {
    rectLeft = chosen.left - popW / 2
    rectTop = chosen.top
  } else if (chosen.placement === 'right') {
    rectLeft = chosen.left
    rectTop = chosen.top - popH / 2
  } else {
    rectLeft = chosen.left - popW
    rectTop = chosen.top - popH / 2
  }

  // clamp rect
  rectLeft = clamp(rectLeft, margin, vw - margin - popW)
  rectTop = clamp(rectTop, margin, vh - margin - popH)

  // رجّع dock left/top بما يناسب transform
  let dockLeft = chosen.left
  let dockTop = chosen.top

  if (chosen.placement === 'top') {
    dockLeft = rectLeft + popW / 2
    dockTop = rectTop + popH
  } else if (chosen.placement === 'bottom') {
    dockLeft = rectLeft + popW / 2
    dockTop = rectTop
  } else if (chosen.placement === 'right') {
    dockLeft = rectLeft
    dockTop = rectTop + popH / 2
  } else {
    dockLeft = rectLeft + popW
    dockTop = rectTop + popH / 2
  }

  return { placement: chosen.placement, left: dockLeft, top: dockTop }
}

export default function ProjectsOverlay({
  open,
  view,
  overlay, // { spot, placement, left, top, popW, popH, buildingScreen }
  activeProject,
  detailsOpen,
  dialogOpen,

  onCloseList,
  onProjectPick,
  onOpenDetails,
  onCloseDetails,
  onCloseDialog,

  player,
}) {
  useEffect(() => {
    // ✅ lock/unlock حسب open
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'projects', locked: Boolean(open) },
        }),
      )
    } catch {}

    // ✅ لو الـ overlay اتشال/unmount لأي سبب → فك القفل
    return () => {
      try {
        window.dispatchEvent(
          new CustomEvent('phantasm:overlayLock', {
            detail: { key: 'projects', locked: false },
          }),
        )
      } catch {}
    }
  }, [open])

  useLockIslandGestures(open)

  if (!open || !overlay) return null

  const mobile = isMobile(view.w)

  const { w: popW, h: popH } = getPopoverDims(view.w, view.h, overlay.popW)

  // ✅ احسب placement + dock left/top بحيث يفضل جوه viewport
  const dockPos = useMemo(() => {
    return computeDockPosition({
      preferredPlacement: overlay.placement, // كان عندك top/right/left — هنقبل bottom كمان
      anchorX: overlay.left,
      anchorY: overlay.top,
      popW,
      popH,
      vw: view.w,
      vh: view.h,
    })
  }, [overlay.left, overlay.top, overlay.placement, popW, popH, view.w, view.h])

  // ✅ base position of the whole DOCK (list + details)
  const dockStyle = useMemo(() => {
    const base = {
      position: 'absolute',
      left: dockPos.left,
      top: dockPos.top,
      pointerEvents: 'auto',
    }

    const placement = dockPos.placement

    if (placement === 'top') {
      base.transform = 'translate(-50%, -100%)'
      // بزيادة أمان (خصوصًا لو popW اتغير)
      base.left = clampToViewportX(dockPos.left, view.w, popW, MARGIN)
    } else if (placement === 'bottom') {
      base.transform = 'translate(-50%, 0%)'
      base.left = clampToViewportX(dockPos.left, view.w, popW, MARGIN)
    } else if (placement === 'right') {
      base.transform = 'translate(0%, -50%)'
    } else {
      base.transform = 'translate(-100%, -50%)'
    }

    return base
  }, [dockPos.left, dockPos.top, dockPos.placement, popW, view.w])

  const placement = dockPos.placement

  // ✅ list rect in viewport coords (we use it ONLY for details positioning)
  const listRect = useMemo(() => {
    const listLeft =
      placement === 'top' || placement === 'bottom'
        ? dockStyle.left - popW / 2
        : placement === 'right'
          ? dockStyle.left
          : dockStyle.left - popW

    const listTop =
      placement === 'top'
        ? dockPos.top - popH
        : placement === 'bottom'
          ? dockPos.top
          : dockPos.top - popH / 2

    return {
      left: listLeft,
      top: listTop,
      right: listLeft + popW,
      bottom: listTop + popH,
      centerX: listLeft + popW / 2,
      centerY: listTop + popH / 2,
    }
  }, [placement, dockStyle.left, dockPos.top, popW, popH])

  // ✅ choose best placement for details around list, always stay in viewport
  const detailsPlacementAndStyle = useMemo(() => {
    if (mobile) {
      return { placement: 'top', style: null } // الموبايل: sheet
    }

    const w = DETAILS_W
    const h = 280
    const vw = view.w
    const vh = view.h

    const fits = (left, top, ww, hh) =>
      left >= MARGIN && top >= MARGIN && left + ww <= vw - MARGIN && top + hh <= vh - MARGIN

    const cands = [
      { placement: 'right', left: listRect.right + GAP - 60, top: listRect.centerY - h / 2 + 5 },
      { placement: 'left', left: listRect.left - GAP - w + 60, top: listRect.centerY - h / 2 + 5 },
      { placement: 'bottom', left: listRect.centerX - w / 2 + 10, top: listRect.bottom + GAP },
      { placement: 'top', left: listRect.centerX - w / 2 - 10, top: listRect.top - GAP - h },
    ]

    const fully = cands.find((c) => fits(c.left, c.top, w, h))
    const chosen = fully || cands[0]

    const clampedLeft = clamp(chosen.left, MARGIN, vw - MARGIN - w)
    const clampedTop = clamp(chosen.top, MARGIN, vh - MARGIN - h)

    return {
      placement: chosen.placement === 'left' ? 'left' : 'right', // الأنيميشن left/right فقط
      style: {
        position: 'fixed',
        left: clampedLeft,
        top: clampedTop,
        width: w,
        zIndex: 130,
        pointerEvents: 'auto',
      },
    }
  }, [mobile, view.w, view.h, listRect])

  const handleProjectClick = (p) => {
    onCloseDetails?.()
    onProjectPick?.(p)
  }

  const handleRequestDetails = () => {
    onCloseDialog?.()
    onOpenDetails?.()
  }

  return (
    <div className="fixed inset-0 z-[120]">
      {/* ✅ backdrop يمنع drag/zoom + يقفل الليست */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,.18)' }}
        onClick={() => onCloseList?.()}
      />

      {/* ✅ DOCK */}
      <div style={dockStyle} onClick={(e) => e.stopPropagation()}>
        <AnimatePresence>
          <motion.div
            key="projectsDockInner"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative"
          >
            <ProjectsPopover
              title={overlay.spot.name}
              projects={overlay.spot.projects || []}
              placement={placement}
              activeProjectId={activeProject?.id}
              onClose={onCloseList}
              onProjectClick={handleProjectClick}
              fixedHeight={POPOVER_H}
            />

            <BuildingPointer placement={placement} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ✅ DETAILS PANEL */}
      {detailsOpen && !dialogOpen ? (
        mobile ? (
          <ProjectDetailsPanel
            open
            placement="top"
            project={activeProject}
            onClose={onCloseDetails}
            width="100%"
          />
        ) : (
          <div style={detailsPlacementAndStyle.style} onClick={(e) => e.stopPropagation()}>
            <ProjectDetailsPanel
              open
              placement={detailsPlacementAndStyle.placement}
              project={activeProject}
              onClose={onCloseDetails}
              width={DETAILS_W}
            />
          </div>
        )
      ) : null}

      {/* ✅ DIALOG */}
      {dialogOpen ? (
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 pointer-events-auto"
          style={{ width: 'min(820px, calc(100vw - 24px))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <ProjectDialogPanel
            open
            project={activeProject}
            player={player}
            onClose={onCloseDialog}
            onRequestDetails={handleRequestDetails}
          />
          <div className="flex justify-center mt-2 opacity-80">
            <div className="h-1 w-16 rounded-full bg-white/25" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
