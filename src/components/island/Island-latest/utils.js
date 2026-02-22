export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export function percentToPxX(xPct, mapW) {
  return (Number(xPct || 0) / 100) * mapW
}

export function percentToPxY(yPct, mapH) {
  return (Number(yPct || 0) / 100) * mapH
}

export function worldToScreen({ worldX, worldY, state }) {
  // state: { x, y, scale } from RZP
  return {
    sx: state.x + worldX * state.scale,
    sy: state.y + worldY * state.scale,
  }
}

export function computePopoverPlacement({ viewportH, anchorScreenY, popoverH, margin = 14 }) {
  const above = anchorScreenY - margin
  const below = viewportH - anchorScreenY - margin

  if (above >= popoverH) return 'top'
  if (below >= popoverH) return 'bottom'
  return above >= below ? 'top' : 'bottom'
}
export function clampToViewportX(x, viewportW, popoverW, margin = 12) {
  // x هو CENTER (لأننا بنستخدم translateX(-50%))
  const half = popoverW / 2
  const min = margin + half
  const max = viewportW - margin - half
  return Math.max(min, Math.min(max, x))
}

export function choosePlacementNoBottom({
  viewportW,
  viewportH,
  buildingScreen, // {left, top, right, bottom, cx, cy}
  popoverW,
  popoverH,
  margin = 14,
  gap = 14,
}) {
  // مساحات حول المبنى
  const spaceTop = buildingScreen.top - gap - margin
  const spaceRight = viewportW - (buildingScreen.right + gap) - margin
  const spaceLeft = buildingScreen.left - gap - margin

  // 1) TOP
  if (spaceTop >= popoverH) return 'top'

  // 2) RIGHT
  if (spaceRight >= popoverW) return 'right'

  // 3) LEFT
  if (spaceLeft >= popoverW) return 'left'

  // fallback: لو ولا واحدة نفعت، برضو TOP (هنعمل clamp)
  return 'top'
}
export function clampPopoverToViewport({ left, top, popoverW, popoverH, vw, vh, margin = 8 }) {
  let x = left
  let y = top

  // ✅ clamp X
  if (x < margin) x = margin
  if (x + popoverW > vw - margin) x = Math.max(margin, vw - margin - popoverW)

  // ✅ clamp Y
  if (y < margin) y = margin
  if (y + popoverH > vh - margin) y = Math.max(margin, vh - margin - popoverH)

  return { left: x, top: y }
}
