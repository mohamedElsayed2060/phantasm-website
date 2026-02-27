'use client'

import { useEffect } from 'react'

// ✅ Hides the SSR splash shell after a minimum time.
// This prevents the "content -> splash -> content" flash on refresh.
export default function SsrSplashHider({ minMs = 650 }) {
  useEffect(() => {
    const el = document.getElementById('ssr-splash')
    if (!el) return

    const t = setTimeout(
      () => {
        el.style.transition = 'opacity 180ms ease'
        el.style.opacity = '0'
        setTimeout(() => el.remove(), 220)
      },
      Math.max(0, Number(minMs) || 0),
    )

    return () => clearTimeout(t)
  }, [minMs])

  return null
}
