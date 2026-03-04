'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProjectsPopover from './ProjectsPopover'
import BuildingPointer from './BuildingPointer'
import ProjectDetailsPanel from './ProjectDetailsPanel'
import BuildingDialogPanel from './BuildingDialogPanel'
import { clampToViewportX } from '../utils'
import useLockIslandGestures from '@/components/overlays/useLockIslandGestures'

const POPOVER_W = 360
const POPOVER_H = 170
const GAP = 5
const MARGIN = 14
const DETAILS_W = 560

function isMobile(viewW) {
  return viewW < 768
}

const clamp = (n, min, max) => Math.max(min, Math.min(n, max))

function getPopoverDims(viewW, viewH, overlayPopW) {
  const w = overlayPopW || Math.min(POPOVER_W, viewW - 24)
  const h = POPOVER_H
  return { w, h }
}

function computeDockPosition({ preferredPlacement, anchorX, anchorY, popW, popH, vw, vh }) {
  const margin = MARGIN
  const gap = GAP
  const order = (() => {
    const all = ['top', 'bottom', 'right', 'left']
    const pref = preferredPlacement && all.includes(preferredPlacement) ? preferredPlacement : 'top'
    return [pref, ...all.filter((x) => x !== pref)]
  })()

  const make = (placement) => {
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
  let chosen = null
  for (const pl of order) {
    const p = make(pl)
    if (fits(p.placement, p.left, p.top)) {
      chosen = p
      break
    }
  }

  if (!chosen) chosen = make(order[0])

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
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'projects', locked: Boolean(open) },
        }),
      )
    } catch {}

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

  const mobile = isMobile(view.w)

  const { w: popW, h: popH } = overlay
    ? getPopoverDims(view.w, view.h, overlay.popW)
    : { w: POPOVER_W, h: POPOVER_H }

  const dockPos = useMemo(() => {
    if (!overlay) return { placement: 'top', left: 0, top: 0 }

    return computeDockPosition({
      preferredPlacement: overlay.placement,
      anchorX: overlay.left,
      anchorY: overlay.top,
      popW,
      popH,
      vw: view.w,
      vh: view.h,
    })
  }, [overlay?.left, overlay?.top, overlay?.placement, popW, popH, view.w, view.h])

  // ✅ base position of the whole DOCK (list + details)
  const dockStyle = useMemo(() => {
    if (!overlay) return { placement: 'top', left: 0, top: 0 }

    const base = {
      position: 'absolute',
      left: dockPos.left,
      top: dockPos.top,
      pointerEvents: 'auto',
    }

    const placement = dockPos.placement

    if (placement === 'top') {
      base.transform = 'translate(-50%, -100%)'
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

  const listRect = useMemo(() => {
    if (!overlay) return { placement: 'top', left: 0, top: 0 }

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

  const detailsPlacementAndStyle = useMemo(() => {
    if (!overlay) return { placement: 'top', left: 0, top: 0 }

    if (mobile) {
      return { placement: 'top', style: null }
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
      placement: chosen.placement === 'left' ? 'left' : 'right',
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

  const handleProjectClick = useCallback(
    (p) => {
      onCloseDetails?.()
      onCloseDialog?.()
      onProjectPick?.(p)
    },
    [onCloseDetails, onCloseDialog, onProjectPick],
  )
  if (!open || !overlay) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,.18)' }}
        onClick={() => onCloseList?.()}
      />

      {/* DOCK */}
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
              categoryTitle={overlay.spot.projectCategoryTitle || ''}
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

      {/*  DETAILS PANEL */}
      {detailsOpen ? (
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

      {/* DIALOG */}
      {dialogOpen ? (
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 pointer-events-auto"
          style={{ width: 'min(820px, calc(100vw - 24px))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <BuildingDialogPanel open spot={overlay.spot} player={player} onClose={onCloseDialog} />
          <div className="flex justify-center mt-2 opacity-80">
            <div className="h-1 w-16 rounded-full bg-white/25" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
