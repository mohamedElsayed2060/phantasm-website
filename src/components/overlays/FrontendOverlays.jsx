'use client'

import { useEffect, useMemo, useState } from 'react'
import SplashOverlay from './SplashOverlay'
import AvatarGate from './AvatarGate'

/**
 * FrontendOverlays
 * - Ensures correct order: Splash (if any) -> AvatarGate (if needed)
 * - Keeps overlay logic in one place to avoid race conditions / weird timing.
 */
export default function FrontendOverlays({ globals }) {
  const site = globals?.siteSettings
  const splash = site?.splash
  const playerSelection = globals?.playerSelection

  const logoUrl = site?.logo?.url || site?.logoUrl || null
  const companyName = site?.companyName || 'PHANTASM'

  const splashEnabled = splash?.enabled !== false

  const [splashDone, setSplashDone] = useState(!splashEnabled)

  // If splash is enabled but decides to skip (e.g. session already seen), it will call onDone.
  // Still, we keep a safety: if config toggles while mounted.
  useEffect(() => {
    if (!splashEnabled) setSplashDone(true)
  }, [splashEnabled])

  const allowGate = useMemo(() => {
    return splashDone
  }, [splashDone])

  return (
    <>
      <SplashOverlay
        config={splash}
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
    </>
  )
}
