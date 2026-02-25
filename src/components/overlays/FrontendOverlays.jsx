'use client'

import { useEffect, useState } from 'react'
import AvatarGate from './AvatarGate'
import HomeDockOverlay from './HomeDockOverlay'
import useLockIslandGestures from './useLockIslandGestures'
import { usePathname } from 'next/navigation'
import useLockPageZoom from './useLockPageZoom'
/**
 * FrontendOverlays (STATIC)
 * - No Splash here anymore.
 * - AvatarGate & HomeDock are NOT gated by splash.
 * - Overlay locks still control island gestures + dock visibility with projects overlay.
 */
export default function FrontendOverlays({ globals }) {
  const playerSelection = globals?.playerSelection
  const homeDock = globals?.homeDock
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [locks, setLocks] = useState({})

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

  const anyOverlayLocked = Object.values(locks).some(Boolean)
  const isProjectsOpen = Boolean(locks?.projects)

  // ✅ قفل gestures لما أي overlay مفتوح/locked
  useLockIslandGestures(anyOverlayLocked && isHome)
  useLockPageZoom(true)
  return (
    <>
      <AvatarGate config={playerSelection} allowOpen={true} />
      <HomeDockOverlay config={homeDock} allowOpen={!isProjectsOpen} />
    </>
  )
}
