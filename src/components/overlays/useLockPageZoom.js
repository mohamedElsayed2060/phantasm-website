'use client'
import { useEffect } from 'react'

export default function useLockPageZoom(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onWheel = (e) => {
      // ✅ امنع browser zoom بالـ ctrl + wheel
      if (e.ctrlKey) e.preventDefault()
    }

    const onKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey
      if (!isMod) return

      // ✅ امنع ctrl/cmd + (+/-/0) للزوم
      const k = e.key
      if (k === '+' || k === '=' || k === '-' || k === '0') {
        e.preventDefault()
      }
    }

    const onTouchMove = (e) => {
      // ✅ امنع pinch (two fingers) فقط
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    }

    // Safari iOS gesture events
    const onGesture = (e) => e.preventDefault()

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    window.addEventListener('gesturestart', onGesture, { passive: false })
    window.addEventListener('gesturechange', onGesture, { passive: false })
    window.addEventListener('gestureend', onGesture, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchmove', onTouchMove)

      window.removeEventListener('gesturestart', onGesture)
      window.removeEventListener('gesturechange', onGesture)
      window.removeEventListener('gestureend', onGesture)
    }
  }, [enabled])
}
