'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ✅ عدّل المسار ده حسب اللي عندك في lib/cms
import { getProjectBySlug } from '@/lib/cms'

function pickThumb(p) {
  return (
    p?.thumbSrc ||
    p?.thumb?.url ||
    p?.thumb?.sizes?.medium?.url ||
    p?.thumb?.sizes?.small?.url ||
    p?.thumb?.thumbnailURL ||
    null
  )
}

export default function ProjectDetailsClient({ slug }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr(null)

    getProjectBySlug(slug)
      .then((res) => {
        if (!alive) return
        setProject(res || null)
      })
      .catch((e) => {
        if (!alive) return
        setErr(e)
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return <div className="min-h-screen bg-black text-white grid place-items-center">Loading…</div>
  }

  if (err || !project) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <button
          className="mb-6 px-4 py-2 rounded bg-white/10 hover:bg-white/15"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <div className="text-white/80">Project not found.</div>
      </div>
    )
  }

  const title = project?.title || 'Project'
  const short = project?.shortDescription || project?.description || ''
  const img = pickThumb(project)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          className="mb-6 px-4 py-2 rounded bg-white/10 hover:bg-white/15"
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <div className="grid gap-6 md:grid-cols-[1fr_420px]">
          {/* Text */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="text-[12px] uppercase tracking-[0.25em] text-white/60">
              Project details
            </div>
            <h1 className="mt-2 text-2xl font-semibold">{title}</h1>

            {project?.tag ? (
              <div className="mt-2 inline-flex text-[12px] px-2 py-1 rounded bg-white/10 border border-white/10">
                {project.tag}
              </div>
            ) : null}

            <div className="mt-4 text-[14px] leading-relaxed text-white/80 whitespace-pre-line">
              {short || '—'}
            </div>

            {/* placeholders for later fields */}
            <div className="mt-6 grid gap-2 text-[12px] text-white/60">
              {project?.client ? <div>Client: {project.client}</div> : null}
              {project?.type ? <div>Type: {project.type}</div> : null}
              {project?.coverage ? <div>Coverage: {project.coverage}</div> : null}
            </div>
          </div>

          {/* Image (later slider) */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-white/95">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={project?.thumb?.alt || title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-[380px] grid place-items-center text-black/60">No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
