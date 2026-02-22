'use client'

import React, { useMemo } from 'react'
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
const DETAILS_W = 560 // ✅ لازم يطابق ستايل Panel اللي عندك (أنت عامل 560 على الديسكتوب)

function isMobile(viewW) {
  return viewW < 768
}

const clamp = (n, min, max) => Math.max(min, Math.min(n, max))

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
  useLockIslandGestures(open)
  if (!open || !overlay) return null

  const mobile = isMobile(view.w)

  const popW = overlay.popW || Math.min(POPOVER_W, view.w - 24)
  const placement = overlay.placement // top/right/left (no bottom)

  // ✅ base position of the whole DOCK (list + details)
  const dockStyle = useMemo(() => {
    const base = {
      position: 'absolute',
      left: overlay.left,
      top: overlay.top,
      pointerEvents: 'auto',
    }

    if (placement === 'top') {
      base.transform = 'translate(-50%, -100%)'
      base.left = clampToViewportX(overlay.left, view.w, popW, MARGIN)
    } else if (placement === 'right') {
      base.transform = 'translate(0%, -50%)'
    } else {
      base.transform = 'translate(-100%, -50%)'
    }

    return base
  }, [overlay.left, overlay.top, placement, popW, view.w])

  // ✅ list rect in viewport coords (we use it ONLY for details positioning)
  const listRect = useMemo(() => {
    const listLeft =
      placement === 'top'
        ? dockStyle.left - popW / 2
        : placement === 'right'
          ? dockStyle.left
          : dockStyle.left - popW

    const listTop = placement === 'top' ? overlay.top - POPOVER_H : overlay.top - POPOVER_H / 2

    return {
      left: listLeft,
      top: listTop,
      right: listLeft + popW,
      bottom: listTop + POPOVER_H,
      centerX: listLeft + popW / 2,
      centerY: listTop + POPOVER_H / 2,
    }
  }, [placement, dockStyle.left, overlay.top, popW])

  // ✅ choose best placement for details around list, always stay in viewport
  const detailsPlacementAndStyle = useMemo(() => {
    if (mobile) {
      return { placement: 'top', style: null } // عندك الموبايل بيرسل top عشان يفتح sheet
    }

    const w = DETAILS_W
    const h = 280 // ✅ تقدير مبدئي.. هنعمل clamp بالـ viewport (مش لازم يكون exact)
    const vw = view.w
    const vh = view.h

    const fits = (left, top, ww, hh) =>
      left >= MARGIN && top >= MARGIN && left + ww <= vw - MARGIN && top + hh <= vh - MARGIN

    // candidates: right, left, bottom, top (relative to list)
    const cands = [
      {
        placement: 'right',
        left: listRect.right + GAP - 60,
        top: listRect.centerY - h / 2 + 5,
      },
      {
        placement: 'left',
        left: listRect.left - GAP - w + 60,
        top: listRect.centerY - h / 2 + 5,
      },
      {
        placement: 'bottom',
        left: listRect.centerX - w / 2 + 10,
        top: listRect.bottom + GAP,
      },
      {
        placement: 'top',
        left: listRect.centerX - w / 2 - 10,
        top: listRect.top - GAP - h,
      },
    ]

    // 1) choose first that fully fits
    const fully = cands.find((c) => fits(c.left, c.top, w, h))
    const chosen = fully || cands[0] // default: right

    // 2) clamp inside viewport even if it overlaps list
    const clampedLeft = clamp(chosen.left, MARGIN, vw - MARGIN - w)
    const clampedTop = clamp(chosen.top, MARGIN, vh - MARGIN - h)

    return {
      placement:
        chosen.placement === 'bottom'
          ? 'right'
          : chosen.placement === 'top'
            ? 'right'
            : chosen.placement,
      // ملاحظة: panel نفسه بيستخدم placement للأنيميشن left/right فقط
      // فلو اخترنا top/bottom، هنحركه جوه الفيوپورت ونخليه placement "right" للأنيميشن
      style: {
        position: 'fixed',
        left: clampedLeft,
        top: clampedTop,
        width: w,
        zIndex: 90,
        pointerEvents: 'auto',
      },
    }
  }, [mobile, view.w, view.h, listRect])

  // ✅ Handler: اختيار مشروع
  const handleProjectClick = (p) => {
    onCloseDetails?.()
    onProjectPick?.(p)
  }

  // ✅ Handler: الديالوج طلب فتح التفاصيل
  const handleRequestDetails = () => {
    onCloseDialog?.()
    onOpenDetails?.()
  }

  return (
    <div className="fixed inset-0 z-[80]">
      {/* ✅ backdrop يمنع drag/zoom + يقفل الليست */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,.18)' }}
        onClick={() => onCloseList?.()}
      />

      {/* ✅ DOCK: list anchor stays as-is */}
      <div style={dockStyle} onClick={(e) => e.stopPropagation()}>
        <div className="relative">
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
        </div>
      </div>

      {/* ✅ DETAILS PANEL */}
      {detailsOpen && !dialogOpen ? (
        mobile ? (
          // ✅ Mobile: Bottom Sheet (ProjectDetailsPanel عندك بيفتح sheet لما placement="top")
          <ProjectDetailsPanel
            open
            placement="top"
            project={activeProject}
            onClose={onCloseDetails}
            width="100%"
          />
        ) : (
          // ✅ Desktop: fixed + clamped داخل الفيو بورت (مرتبط باليست)
          <div style={detailsPlacementAndStyle.style} onClick={(e) => e.stopPropagation()}>
            <ProjectDetailsPanel
              open
              placement={detailsPlacementAndStyle.placement} // left/right للأنيميشن
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
