'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import SplashOverlay from './SplashOverlay'

export default function SplashRouteTransitionClient({
  defaultMinMs = 650, // ✅ زوّدها براحتك
  holdAfterReadyMs = 200, // ✅ “زيادة صغيرة” بعد ما الداتا/الروت جاهز
  logoUrl,
  companyName,
  initialOnMount = true,
  initialMinMs = 650,
}) {
  const pathname = usePathname()

  const [open, setOpen] = useState(false)
  const [minMs, setMinMs] = useState(defaultMinMs)

  const lastPathRef = useRef(pathname)
  const closeTimerRef = useRef(null)

  // tracking
  const openedAtRef = useRef(0)
  const readyRef = useRef(false)
  const initialShownRef = useRef(false)

  const clearClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const scheduleClose = (extraHold = holdAfterReadyMs) => {
    if (!readyRef.current) return
    const elapsed = Date.now() - (openedAtRef.current || Date.now())
    const remaining = Math.max(0, (Number(minMs) || 0) - elapsed)
    const wait = remaining + Math.max(0, Number(extraHold) || 0)

    clearClose()
    closeTimerRef.current = setTimeout(() => setOpen(false), wait)
  }

  const safeOpen = (ms) => {
    clearClose()
    setMinMs(typeof ms === 'number' ? ms : defaultMinMs)
    openedAtRef.current = Date.now()
    readyRef.current = false
    setOpen(true)
  }

  // 1) ✅ initial splash after refresh
  useEffect(() => {
    if (!initialOnMount || initialShownRef.current) return
    initialShownRef.current = true

    safeOpen(initialMinMs)

    // في أول load: الصفحة already موجودة => اعتبرها جاهزة
    readyRef.current = true
    scheduleClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) clicks (قبل router.push)
  useEffect(() => {
    const onStart = (e) => {
      const ms = e?.detail?.minMs
      safeOpen(typeof ms === 'number' ? ms : defaultMinMs)
    }
    window.addEventListener('phantasm:splashStart', onStart)
    return () => window.removeEventListener('phantasm:splashStart', onStart)
  }, [defaultMinMs])

  // 3) ✅ back/forward: popstate غالبًا بييجي بعد تغيير الـ URL
  // فاعتبر الصفحة جاهزة، واقفل بعد minMs + hold
  useEffect(() => {
    const onPop = () => {
      safeOpen(defaultMinMs)
      readyRef.current = true
      scheduleClose()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultMinMs, minMs, holdAfterReadyMs])

  // 4) route ready: pathname changed
  useEffect(() => {
    if (!open) {
      lastPathRef.current = pathname
      return
    }

    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname
      readyRef.current = true
      scheduleClose()
    }

    return () => clearClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, open, minMs, holdAfterReadyMs])

  useEffect(() => () => clearClose(), [])

  return <SplashOverlay open={open} minMs={minMs} logoUrl={logoUrl} companyName={companyName} />
}
