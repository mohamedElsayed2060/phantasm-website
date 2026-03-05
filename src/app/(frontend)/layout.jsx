// src/app/(frontend)/layout.jsx
import './frontend.css'
import { getFrontendGlobals } from '@/lib/cms'
import FrontendOverlays from '@/components/overlays/FrontendOverlays'
import SplashManagerClient from '@/components/overlays/SplashManagerClient'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: {
    default: 'PHANTASM',
    template: '%s | PHANTASM',
  },
  description:
    'We specialise in creating engaging games and software applications that bring your ideas to life.',
}

// src/app/(frontend)/layout.jsx

export default async function FrontendLayout({ children }) {
  const globals = await getFrontendGlobals()

  return (
    <div className="min-h-screen silkscreen-font bg-black text-white overflow-hidden relative">
      <div
        id="ssr-splash"
        className="fixed inset-0 z-[10050] flex items-center justify-center overflow-hidden bg-black"
      >
        {/* ✅ نفس intro cover */}
        <div className="absolute inset-0 z-[15] pointer-events-none bg-red-500/6" />

        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/intro-82.jpg)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            // // blur خفيف زي اللي عملناه
            // filter: 'blur(2px)',
            // transform: 'scale(1.02)', // يمنع حواف البلور
          }}
        />

        {/* ✅ dim + blur overlay (زي client) */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-2xl" />

        {/* loader */}
        <div className="relative z-[10] flex flex-col items-center gap-6">
          <div className="h-[2px] w-[140px] md:w-[200px] overflow-hidden bg-white/10 rounded-full">
            <div className="h-full w-1/3 bg-white/60 animate-[phantasmBar_0.9s_linear_infinite]" />
          </div>
        </div>
      </div>
      <SplashManagerClient />
      <FrontendOverlays globals={globals} />
      {children}
    </div>
  )
}
