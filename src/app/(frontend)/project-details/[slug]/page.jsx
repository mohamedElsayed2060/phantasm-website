// src/app/(frontend)/project-details/[slug]/page.jsx
import { notFound } from 'next/navigation'
import { getProjectBySlugServer } from '@/lib/cms.server'
import ProjectDetailsClient from './ProjectDetailsClient'

export const revalidate = 30

export default async function ProjectDetailsPage({ params }) {
  const { slug } = await params

  const project = await getProjectBySlugServer(slug)
  if (!project) return notFound()

  // ✅ نخلي الـ Client زي ما هو، بس نمررله الداتا جاهزة
  return <ProjectDetailsClient project={project} />
}
