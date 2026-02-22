'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ✅ Helper لاختيار أفضل صورة متاحة من Payload
function pickThumb(p) {
  return (
    p?.thumbSrc ||
    p?.thumb?.url ||
    p?.previewImage?.url ||
    p?.previewImage?.sizes?.large?.url ||
    p?.previewImage?.sizes?.medium?.url ||
    p?.previewImage?.sizes?.small?.url ||
    p?.thumb?.sizes?.medium?.url ||
    p?.thumb?.sizes?.small?.url ||
    p?.thumb?.thumbnailURL ||
    null
  )
}

export default function ProjectDetailsClient({ project }) {
  const router = useRouter()

  // ✅ خلي أي mapping موجود عندك هنا (لو احتجته لاحقًا)
  const data = useMemo(() => project || null, [project])

  if (!data) {
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

  const title = data?.title || 'Project'
  const short = data?.shortDescription || data?.description || ''
  const img = pickThumb(data)

  // Payload previewImage alt ممكن يكون في previewImage.alt أو .altText حسب إعداداتكم
  const imgAlt = data?.previewImage?.alt || data?.previewImage?.altText || data?.thumb?.alt || title

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

            {data?.tag ? (
              <div className="mt-2 inline-flex text-[12px] px-2 py-1 rounded bg-white/10 border border-white/10">
                {data.tag}
              </div>
            ) : null}

            <div className="mt-4 text-[14px] leading-relaxed text-white/80 whitespace-pre-line">
              {short || '—'}
            </div>

            {/* placeholders for later fields */}
            <div className="mt-6 grid gap-2 text-[12px] text-white/60">
              {data?.client ? <div>Client: {data.client}</div> : null}
              {data?.type ? <div>Type: {data.type}</div> : null}
              {data?.coverage ? <div>Coverage: {data.coverage}</div> : null}
            </div>
          </div>

          {/* Image (later slider) */}
          <div className="rounded-xl overflow-hidden border border-white/10 bg-white/95">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={imgAlt} className="w-full h-full object-cover" />
            ) : (
              <div className="h-[380px] grid place-items-center text-black/60">No image</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
