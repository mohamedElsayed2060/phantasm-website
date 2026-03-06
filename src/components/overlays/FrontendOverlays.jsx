'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import AvatarGate from './AvatarGate'
import HomeDockOverlay from './HomeDockOverlay'
import useLockIslandGestures from './useLockIslandGestures'
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

  // ✅ اقفل gestures على الجزيرة لما أي overlay يبقى مفتوح (في الهوم بس)
  useLockIslandGestures(anyOverlayLocked && isHome)

  // ✅ اقفل zoom للصفحة (زي ما انت عامل)
  useLockPageZoom(true)

  // ✅ AvatarGate لازم يبقى مسموح يفتح دايمًا (لو مفيش لاعب مختار)
  const allowAvatarGate = true

  return (
    <>
      <AvatarGate config={playerSelection} allowOpen={allowAvatarGate} />
      <HomeDockOverlay config={homeDock} allowOpen={!isProjectsOpen} />
    </>
  )
}
