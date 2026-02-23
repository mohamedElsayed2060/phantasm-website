// C:\Users\mohamed\Desktop\island-map-real\phantasm-web\src\app\(frontend)\island-rzp\page.jsx

import IslandLab from '@/components/island/Island-latest/IslandLab'
import { getIslandScene, getIslandHotspots, getIslandBootDock } from '@/lib/islandCms'
export const dynamic = 'force-dynamic'
export const revalidate = 30
export default async function Page() {
  const [hotspots, scene, bootDock] = await Promise.all([
    getIslandHotspots(),
    getIslandScene(),
    getIslandBootDock(),
  ])

  return <IslandLab scene={scene} hotspots={hotspots} bootDock={bootDock} />
}
