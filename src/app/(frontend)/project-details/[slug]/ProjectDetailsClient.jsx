'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import SplashLink from '@/components/overlays/SplashLink'
import ProjectMedia from '../ui/ProjectMedia'
import ProjectDetailsScrollPanel from '../ui/ProjectDetailsScrollPanel'
import MobileDetailsSheet from '../ui/MobileDetailsSheet'

export default function ProjectDetailsClient({ project }) {
  const [panelH, setPanelH] = useState(null)

  const data = useMemo(() => project || null, [project])
  if (!data) return null

  const backHref = '/'
  const mediaRef = useRef(null)
  useEffect(() => {
    const calc = () => setPanelH(Math.max(260, window.innerHeight - 50))
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return (
    <div className="w-full bg-black text-white">
      {/* Desktop: no page scroll, right panel scroll only */}
      <div className="hidden md:block h-[100dvh] min-h-[520px] overflow-hidden">
        <div className="h-full grid grid-cols-2">
          {/* LEFT: media + back button */}
          <div className="relative bg-white h-full">
            {/* back button inside left */}
            <div className="absolute top-4 left-4 z-20">
              <SplashLink href={backHref} className="inline-block">
                <img src="/back-icon.png" alt="Back" className="w-9 h-9" />
              </SplashLink>
            </div>

            <ProjectMedia project={data} />
          </div>

          {/* RIGHT: scroll panel ALWAYS full height */}
          <div className="bg-black h-full flex items-center justify-center">
            <div className="w-full h-full p-6">
              {/* ✅ خلي panel ياخد طول الشاشة كله */}
              <ProjectDetailsScrollPanel project={data} maxHeightPx={panelH || 520} />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile */}
      <div className="md:hidden min-h-[100dvh] bg-white relative">
        <div ref={mediaRef} className="bg-white min-h-[260px] flex items-center">
          <ProjectMedia project={data} />
        </div>

        <div className="absolute top-3 left-3 z-[95]">
          <SplashLink href={backHref} className="inline-block">
            <img src="/back-icon.png" alt="Back" className="w-9 h-9" />
          </SplashLink>
        </div>

        <MobileDetailsSheet project={data} anchorRef={mediaRef} />
      </div>
    </div>
  )
}
