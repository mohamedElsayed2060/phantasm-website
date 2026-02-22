'use client'
import { useEffect } from 'react'

export default function useLockIslandGestures(locked) {
  useEffect(() => {
    if (!locked) return

    // نخلي الصفحة ما تعملش bounce عام، بس من غير ما نكتم سكرول الأوفرلاي
    const prevOverscroll = document.documentElement.style.overscrollBehavior
    document.documentElement.style.overscrollBehavior = 'none'

    const isInsideOverlayScroll = (target) => {
      if (!target) return false
      // أي عنصر عليه data-overlay-scroll يعتبر مسموحله بالسكرول
      const el = target.closest?.('[data-overlay-scroll="true"]')
      return Boolean(el)
    }

    const onWheel = (e) => {
      // ✅ دايمًا امنع ctrl+wheel (zoom للصفحة)
      if (e.ctrlKey) {
        e.preventDefault()
        return
      }

      // ✅ لو داخل عنصر مسموح له بالسكرول → سيبه
      if (isInsideOverlayScroll(e.target)) return

      // ✅ غير كده: امنع pan/zoom على الجزيرة
      e.preventDefault()
    }

    const onTouchMove = (e) => {
      // ✅ امنع pinch (two fingers) دائمًا
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
        return
      }

      // ✅ لو اللمس داخل عنصر مسموح له بالسكرول → سيبه
      if (isInsideOverlayScroll(e.target)) return

      // ✅ غير كده امنع gestures بتاعة الجزيرة
      e.preventDefault()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      document.documentElement.style.overscrollBehavior = prevOverscroll
    }
  }, [locked])
}
