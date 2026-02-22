'use client'

import { useEffect, useMemo, useState } from 'react'
import SplashOverlay from './SplashOverlay'
import AvatarGate from './AvatarGate'
import HomeDockOverlay from './HomeDockOverlay' // ✅ جديد
import useLockIslandGestures from './useLockIslandGestures'
/**
 * FrontendOverlays
 * - Order: Splash (optional) -> AvatarGate
 * - Uses ONE canonical event: phantasm:splashDone
 */
export default function FrontendOverlays({ globals }) {
  const site = globals?.siteSettings
  const splash = site?.splash
  const playerSelection = globals?.playerSelection
  const homeDock = globals?.homeDock // ✅ جديد

  const [locks, setLocks] = useState({})

  const logoUrl = site?.logo?.url || site?.logoUrl || null
  const companyName = site?.companyName || 'PHANTASM'

  // ✅ خليه من CMS لو موجود، وإلا true
  const splashEnabled = splash?.enabled ?? true

  const [splashDone, setSplashDone] = useState(false)

  // ✅ لو الـ splash disabled اقفل فورًا
  useEffect(() => {
    if (!splashEnabled) setSplashDone(true)
  }, [splashEnabled])

  const allowGate = useMemo(() => splashDone, [splashDone])

  useEffect(() => {
    const onLock = (e) => {
      const key = e?.detail?.key
      const locked = Boolean(e?.detail?.locked)
      if (!key) return
      setLocks((prev) => ({ ...prev, [key]: locked }))
    }

    window.addEventListener('phantasm:overlayLock', onLock)
    return () => window.removeEventListener('phantasm:overlayLock', onLock)
  }, [])

  const anyOverlayLocked = (splashEnabled && !splashDone) || Object.values(locks).some(Boolean)
  const isProjectsOpen = Boolean(locks?.projects)
  useLockIslandGestures(anyOverlayLocked)
  return (
    <>
      <SplashOverlay
        open={splashEnabled && !splashDone}
        config={{ minMs: 5400 }}
        logoUrl={logoUrl}
        companyName={companyName}
        onDone={() => {
          setSplashDone(true)
          try {
            sessionStorage.setItem('phantasm:splashDone', '1')
          } catch {}
          window.dispatchEvent(new Event('phantasm:splashDone'))
        }}
      />
      <AvatarGate config={playerSelection} allowOpen={allowGate} />
      <HomeDockOverlay config={homeDock} allowOpen={allowGate && !isProjectsOpen} />{' '}
    </>
  )
}
