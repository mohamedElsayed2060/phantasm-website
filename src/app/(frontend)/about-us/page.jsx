import { getAboutUs } from '@/lib/cms'
import AboutUsClient from './ui/AboutUsClient'

export default async function AboutUsPage() {
  const data = await getAboutUs()
  return <AboutUsClient data={data} />
}
