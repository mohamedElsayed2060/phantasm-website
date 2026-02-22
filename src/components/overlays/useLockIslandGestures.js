'use client'
import { useEffect } from 'react'

export default function useLockIslandGestures(locked) {
  useEffect(() => {
    if (!locked) return

    const prevTouchAction = document.documentElement.style.touchAction
    const prevOverscroll = document.documentElement.style.overscrollBehavior
    document.documentElement.style.touchAction = 'none'
    document.documentElement.style.overscrollBehavior = 'none'

    const onWheel = (e) => {
      // يمنع ctrl+wheel و wheel عمومًا أثناء overlay
      e.preventDefault()
    }

    const onTouchMove = (e) => {
      // يمنع pinch/two-finger move
      e.preventDefault()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      document.documentElement.style.touchAction = prevTouchAction
      document.documentElement.style.overscrollBehavior = prevOverscroll
    }
  }, [locked])
}
