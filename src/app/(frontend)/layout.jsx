// src/app/(frontend)/layout.jsx
import { getFrontendGlobals } from '@/lib/cms'
import FrontendOverlays from '@/components/overlays/FrontendOverlays'

export default async function FrontendLayout({ children }) {
  const globals = await getFrontendGlobals()

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <FrontendOverlays globals={globals} />
      {children}
    </div>
  )
}
