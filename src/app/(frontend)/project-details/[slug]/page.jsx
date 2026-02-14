import ProjectDetailsClient from './ProjectDetailsClient'

export default async function ProjectDetailsPage({ params }) {
  const slug = await params?.slug
  return <ProjectDetailsClient slug={slug} />
}
