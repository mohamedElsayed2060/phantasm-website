// src/components/overlays/SplashManagerClient.jsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import SplashOverlay from './SplashOverlay'

const ENV_MIN = Number(process.env.NEXT_PUBLIC_SPLASH_MIN_MS)
const ENV_HOLD = Number(process.env.NEXT_PUBLIC_SPLASH_HOLD_AFTER_READY_MS)

export default function SplashManagerClient({
  defaultMinMs = 1850,
  holdAfterReadyMs = 300,
  maxWaitMs = 9000,
}) {
  const pathname = usePathname()

  const minMs = Number.isFinite(ENV_MIN) && ENV_MIN > 0 ? ENV_MIN : defaultMinMs
  const holdMs = Number.isFinite(ENV_HOLD) && ENV_HOLD >= 0 ? ENV_HOLD : holdAfterReadyMs

  const [open, setOpen] = useState(true)

  const openedAtRef = useRef(Date.now())
  const readyRef = useRef(false)
  const closeTimerRef = useRef(null)
  const forceCloseTimerRef = useRef(null)
  const handedOffRef = useRef(false)

  const modeRef = useRef('boot')
  const cleanupReadyRef = useRef(() => {})
  const clickNavArmedRef = useRef(false)

  const clearClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
    try {
      cleanupReadyRef.current?.()
    } catch {}
    cleanupReadyRef.current = () => {}
  }

  const scheduleClose = () => {
    if (!readyRef.current) return
    const elapsed = Date.now() - (openedAtRef.current || Date.now())
    const remaining = Math.max(0, minMs - elapsed)
    const wait = remaining + Math.max(0, holdMs)

    clearClose()
    closeTimerRef.current = setTimeout(() => {
      setOpen(false)
    }, wait)
  }

  const openBoot = () => {
    clearClose()
    modeRef.current = 'boot'
    openedAtRef.current = Date.now()
    readyRef.current = false
    setOpen(true)
  }

  const openNav = (fromPath) => {
    clearClose()
    modeRef.current = 'nav'
    openedAtRef.current = Date.now()
    readyRef.current = false
    setOpen(true)
  }

  // ✅ تعديل: انتظر sceneReady بدلاً من bootReady
  const waitForIslandReady = () => {
    try {
      if (sessionStorage.getItem('phantasm:sceneReady') === '1') {
        readyRef.current = true
        scheduleClose()
        if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
        forceCloseTimerRef.current = null
        return
      }
    } catch {}

    const onReady = () => {
      window.removeEventListener('phantasm:sceneReady', onReady)
      readyRef.current = true
      scheduleClose()
      if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
      forceCloseTimerRef.current = null
    }
    window.addEventListener('phantasm:sceneReady', onReady)
    cleanupReadyRef.current = () => window.removeEventListener('phantasm:sceneReady', onReady)
  }

  // 1) SSR -> Client handoff
  useEffect(() => {
    if (handedOffRef.current) return
    handedOffRef.current = true

    const removeSsr = () => {
      const el = document.getElementById('ssr-splash')
      if (!el) return
      el.style.transition = 'opacity 180ms ease'
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 220)
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        removeSsr()
      })
    })

    openBoot()

    // ✅ safety: never hang on refresh
    if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
    forceCloseTimerRef.current = setTimeout(() => {
      readyRef.current = true
      scheduleClose()
    }, maxWaitMs)

    if (window.location.pathname === '/') {
      waitForIslandReady() //️ استدعاء المعدّل
    } else {
      readyRef.current = true
      scheduleClose()
      if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
      forceCloseTimerRef.current = null
    }

    return () => {
      if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) clicks
  useEffect(() => {
    const onStart = () => {
      clickNavArmedRef.current = true
      openNav()
    }
    window.addEventListener('phantasm:splashStart', onStart)
    return () => window.removeEventListener('phantasm:splashStart', onStart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 3) pathname changes
  const lastPathRef = useRef(pathname)
  useEffect(() => {
    const prev = lastPathRef.current
    if (pathname === prev) return
    lastPathRef.current = pathname

    // back/forward (route changed without SplashLink)
    if (!open && !clickNavArmedRef.current) {
      openNav(prev)
      readyRef.current = true
      scheduleClose()
      return
    }

    // click nav route landed
    if (modeRef.current === 'nav') {
      clickNavArmedRef.current = false
      if (pathname === '/') {
        waitForIslandReady() //️ استدعاء المعدّل
      } else {
        readyRef.current = true
        scheduleClose()
      }
      return
    }

    // boot mode route change (rare)
    if (modeRef.current === 'boot') {
      if (pathname === '/')
        waitForIslandReady() //️ استدعاء المعدّل
      else {
        readyRef.current = true
        scheduleClose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return <SplashOverlay open={open} minMs={minMs} noFadeInInitial />
}
