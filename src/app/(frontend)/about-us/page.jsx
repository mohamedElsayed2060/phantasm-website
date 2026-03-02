import { getAboutUs } from '@/lib/cms'
import AboutUsClient from './ui/AboutUsClient'
export const metadata = {
  title: 'About Us',
  description: 'Meet the team behind PHANTASM',
}
export default async function AboutUsPage() {
  const data = await getAboutUs()
  return <AboutUsClient data={data} />
}
