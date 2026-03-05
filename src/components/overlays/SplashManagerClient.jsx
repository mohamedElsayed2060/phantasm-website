'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const [isInstant, setIsInstant] = useState(true) // للتحكم في نوع الدخول (مقفول جاهز أم حركة قفل)

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
    setIsInstant(true) // في الريفريش، تظهر مقفولة فوراً
    openedAtRef.current = Date.now()
    readyRef.current = false
    setOpen(true)
  }

  const openNav = (isBackAction = false) => {
    clearClose()
    modeRef.current = 'nav'
    // لو back تظهر مقفولة فوراً، لو كليك عادي تقفل بـ أنيميشن
    setIsInstant(isBackAction)
    openedAtRef.current = Date.now()
    readyRef.current = false
    setOpen(true)
  }

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

    if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
    forceCloseTimerRef.current = setTimeout(() => {
      readyRef.current = true
      scheduleClose()
    }, maxWaitMs)

    if (window.location.pathname === '/') {
      waitForIslandReady()
    } else {
      readyRef.current = true
      scheduleClose()
    }

    return () => {
      if (forceCloseTimerRef.current) clearTimeout(forceCloseTimerRef.current)
    }
  }, [])

  // 2) استماع لأحداث الراوتر المخصص (Click Start)
  useEffect(() => {
    const onStart = () => {
      clickNavArmedRef.current = true
      openNav(false) // انيميشن القفل (لأن المستخدم هو اللي داس)
    }
    window.addEventListener('phantasm:splashStart', onStart)
    return () => window.removeEventListener('phantasm:splashStart', onStart)
  }, [])

  // 3) مراقبة تغيير الـ Pathname
  const lastPathRef = useRef(pathname)
  useLayoutEffect(() => {
    const prev = lastPathRef.current
    if (pathname === prev) return
    lastPathRef.current = pathname

    // Back/Forward (browser) — لازم يتعمل قبل الـ paint
    if (!open && !clickNavArmedRef.current) {
      openNav(true) // instant closed
      readyRef.current = true
      scheduleClose()
      return
    }

    // Click navigation landed
    if (modeRef.current === 'nav') {
      clickNavArmedRef.current = false
      if (pathname === '/') waitForIslandReady()
      else {
        readyRef.current = true
        scheduleClose()
      }
      return
    }

    // Boot mode route change
    if (modeRef.current === 'boot') {
      if (pathname === '/') waitForIslandReady()
      else {
        readyRef.current = true
        scheduleClose()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, open])

  return <SplashOverlay open={open} isInstant={isInstant} />
}
