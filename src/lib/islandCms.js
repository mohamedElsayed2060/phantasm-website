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

  const docs = data?.docs || []

  return docs.map((h) => {
    const projectsRaw = Array.isArray(h.projects) ? h.projects : []

    const projects = projectsRaw
      .map((p) => {
        const preview = p.previewImage ? imgUrl(p.previewImage) : ''

        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          shortDescription: p.shortDescription,
          detailsText: p.detailsText,
          previewImage: absUrl(preview, base),
          ctaLabel: p.ctaLabel,
          ctaType: p.ctaType,
          ctaUrl: p.ctaUrl,
          pages: Array.isArray(p.dialogPages)
            ? p.dialogPages.map((x) => x?.text).filter(Boolean)
            : [],
          order: p.order ?? 0,
        }
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))

    const hotspotIdle = h.hotspotIdle ? imgUrl(h.hotspotIdle) : ''
    const buildingSpawn = h.buildingSpawn ? imgUrl(h.buildingSpawn) : ''
    const buildingLoop = h.buildingLoop ? imgUrl(h.buildingLoop) : ''

    return {
      id: h.id,
      name: h.name,
      trigger: h.trigger || 'click',
      spawnDurationMs: Number(h.spawnDurationMs ?? 1700),

      x: Number(h.x || 0),
      y: Number(h.y || 0),

      // ✅ anchors (0..1)
      anchorX: Number(h.anchorX ?? 0.5),
      anchorY: Number(h.anchorY ?? 0.9),

      buildingW: Number(h.buildingW || 240),
      buildingH: Number(h.buildingH || 240),

      // ✅ absolute image URLs
      hotspotIdleSrc: absUrl(hotspotIdle, base),
      buildingSpawnSrc: absUrl(buildingSpawn, base),
      buildingLoopSrc: absUrl(buildingLoop, base),

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
