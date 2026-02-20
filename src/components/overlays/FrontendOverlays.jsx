'use client'

import { useEffect, useMemo, useState } from 'react'
import SplashOverlay from './SplashOverlay'
import AvatarGate from './AvatarGate'
import HomeDockOverlay from './HomeDockOverlay' // ✅ جديد

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
      <HomeDockOverlay config={homeDock} allowOpen={allowGate} />
    </>
  )
}
