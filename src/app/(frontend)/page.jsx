import IslandCustomLab from '@/components/island/Island-custom/IslandCustomLab'
import { getIslandScene, getIslandHotspots, getIslandBootDock } from '@/lib/islandCms'
import { getHomeDock } from '@/lib/cms'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function Page() {
  const [hotspots, scene, bootDock, homeDock] = await Promise.all([
    getIslandHotspots(),
    getIslandScene(),
    getIslandBootDock(),
    getHomeDock(),
  ])

  return (
    <IslandCustomLab scene={scene} hotspots={hotspots} bootDock={bootDock} homeDock={homeDock} />
  )
}
