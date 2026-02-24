// src/lib/islandCms.js
import { imgUrl } from '@/lib/cms'
import { fetchJSONServer } from './cms.server'

const base = (
  process.env.NEXT_PUBLIC_CMS_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'
).replace(/\/$/, '')

function absUrl(u, base) {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('//')) return (base.startsWith('https') ? 'https:' : 'http:') + s
  if (s.startsWith('/')) return base + s
  return base + '/' + s
}

export async function getIslandScene() {
  try {
    const g = await fetchJSONServer('/api/globals/islandScene?depth=2', {
      revalidate: 30,
      tags: ['island'],
    })

    const bg = g?.background ? imgUrl(g.background) : ''

    return {
      backgroundSrc: absUrl(bg || '', base),
      maxZoomMult: Number(g?.maxZoomMult || 2.5),
    }
  } catch {
    return { backgroundSrc: '', maxZoomMult: 2.5 }
  }
}

export async function getIslandHotspots() {
  const data = await fetchJSONServer('/api/scene-hotspots?limit=200&depth=3&sort=order', {
    revalidate: 30,
    tags: ['island'],
  })

  const docs = Array.isArray(data?.docs) ? data.docs : []

  return docs.map((h) => {
    const projectsRaw = Array.isArray(h?.projects) ? h.projects : []

    const projects = projectsRaw
      .map((p) => {
        const previewRel = p?.previewImage ? imgUrl(p.previewImage) : ''
        return {
          id: p?.id,
          slug: p?.slug,
          title: p?.title,
          shortDescription: p?.shortDescription,
          detailsText: p?.detailsText,
          previewImage: absUrl(previewRel, base),
          ctaLabel: p?.ctaLabel,
          ctaType: p?.ctaType,
          ctaUrl: p?.ctaUrl,
          order: Number(p?.order ?? 0),
        }
      })
      .filter((p) => p?.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const hotspotIdleRel = h?.hotspotIdle ? imgUrl(h.hotspotIdle) : ''
    const buildingSpawnRel = h?.buildingSpawn ? imgUrl(h.buildingSpawn) : ''
    const buildingLoopRel = h?.buildingLoop ? imgUrl(h.buildingLoop) : ''

    // ✅ Building intro pages (NO fallback)
    const introPagesRaw = Array.isArray(h?.introPages) ? h.introPages : []
    const introPages = introPagesRaw
      .map((pg) => {
        const title = String(pg?.title || '').trim()
        const parasRaw = Array.isArray(pg?.paragraphs) ? pg.paragraphs : []
        const paragraphs = parasRaw.map((x) => String(x?.text || '').trim()).filter(Boolean)

        // لازم title + على الأقل paragraph واحدة
        if (!title || paragraphs.length === 0) return null
        return { title, paragraphs }
      })
      .filter(Boolean)

    return {
      id: h?.id,
      name: h?.name,
      trigger: h?.trigger || 'click',
      spawnDurationMs: Number(h?.spawnDurationMs ?? 1700),

      x: Number(h?.x || 0),
      y: Number(h?.y || 0),

      anchorX: Number(h?.anchorX ?? 0.5),
      anchorY: Number(h?.anchorY ?? 0.9),

      buildingW: Number(h?.buildingW || 240),
      buildingH: Number(h?.buildingH || 240),

      hotspotIdleSrc: absUrl(hotspotIdleRel, base),
      buildingSpawnSrc: absUrl(buildingSpawnRel, base),
      buildingLoopSrc: absUrl(buildingLoopRel, base),

      // ✅ new dialog model
      introEnabled: h?.introEnabled !== false,
      introPages,

      projects,
    }
  })
}
export async function getIslandBootDock() {
  try {
    const g = await fetchJSONServer('/api/globals/islandBootDock?depth=0', {
      revalidate: 30,
      tags: ['island'],
    })
    return {
      enabled: Boolean(g?.enabled ?? true),
      title: g?.title || '',
      pages: Array.isArray(g?.pages) ? g.pages.map((p) => p?.text).filter(Boolean) : [],
    }
  } catch {
    return { enabled: false, title: '', pages: [] }
  }
}
