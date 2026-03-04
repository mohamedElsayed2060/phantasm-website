'use client'
import { useEffect } from 'react'

export default function useLockIslandGestures(locked) {
  useEffect(() => {
    if (!locked) return

    const prevOverscroll = document.documentElement.style.overscrollBehavior
    document.documentElement.style.overscrollBehavior = 'none'

    const isInsideOverlayScroll = (target) => {
      if (!target) return false
      const el = target.closest?.('[data-overlay-scroll="true"]')
      return Boolean(el)
    }

    const onWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault()
        return
      }
      if (isInsideOverlayScroll(e.target)) return

      e.preventDefault()
    }

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
        return
      }

      if (isInsideOverlayScroll(e.target)) return

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
