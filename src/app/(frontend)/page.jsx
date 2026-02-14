// src/app/(frontend)/page.jsx
import IslandScene from '@/components/island/IslandScene/IslandScene'
import { getHomeSceneData } from '@/lib/cms'

export default async function HomePage() {
  const { scene, hotspots } = await getHomeSceneData()

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <IslandScene
        sceneKey={scene?.sceneKey || 'phantasm-v1'}
        backgroundSrc={scene?.background?.url || '/island.gif'}
        hotspots={hotspots || []}
        canvasWidths={{
          desktop: scene?.canvasWidthDesktop ?? scene?.canvasWidth ?? 2000,
          tablet: scene?.canvasWidthTablet ?? scene?.canvasWidth ?? 1600,
          mobile: scene?.canvasWidthMobile ?? scene?.canvasWidth ?? 1200,
        }}
      />
    </main>
  )
}
