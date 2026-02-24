// src/app/(frontend)/layout.jsx
import './frontend.css'
import { getFrontendGlobals } from '@/lib/cms'
import FrontendOverlays from '@/components/overlays/FrontendOverlays'
import SplashRouteTransitionClient from '@/components/overlays/SplashRouteTransitionClient'
import PageTransition from '@/components/motion/PageTransition'
import SsrSplashHider from '@/components/overlays/SsrSplashHider'

export const dynamic = 'force-dynamic'

export default async function FrontendLayout({ children }) {
  const globals = await getFrontendGlobals()

  const logoUrl = '/logo.gif'
  const companyName = 'PHANTASM'

  return (
    <div className="min-h-screen silkscreen-font bg-black text-white overflow-hidden relative">
      {/* ✅ SSR splash shell (shows BEFORE hydration) to avoid "content -> splash -> content" flash */}
      <div
        id="ssr-splash"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src={logoUrl}
            alt={companyName}
            draggable={false}
            className="w-[140px] h-auto select-none"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="text-white/80 tracking-[0.24em] text-xs">{companyName}</div>
          <div className="mt-2 h-[2px] w-[160px] overflow-hidden bg-white/10 rounded">
            <div className="h-full w-1/3 bg-white/60 animate-[phantasmBar_0.9s_linear_infinite]" />
          </div>
        </div>
      </div>
      {/* ✅ remove SSR splash after minimum time */}
      <SsrSplashHider minMs={650} />
      {/* ✅ Route transitions only (click/back). No initialOnMount to prevent flash. */}
      <SplashRouteTransitionClient
        // defaultMinMs={650}
        initialOnMount={false}
        // logoUrl={logoUrl}
        // companyName={companyName}
      />
      <FrontendOverlays globals={globals} />
      {/* ✅ Page enter/exit animation لكل الصفحات */}
      <PageTransition>{children}</PageTransition>{' '}
    </div>
  )
}
