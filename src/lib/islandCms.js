// src/lib/islandCms.js
import { headers } from 'next/headers'
import { imgUrl } from '@/lib/cms'

async function getBaseUrl() {
  // ✅ 1) لو محدد CMS URL (production أو لو الـ CMS على دومين تاني)
  const envBase = process.env.NEXT_PUBLIC_CMS_URL || process.env.CMS_URL
  if (envBase) return String(envBase).replace(/\/$/, '')

  // ✅ 2) local dev: ابنِ base من request headers
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'http'
  return `${proto}://${host}`
}

function absUrl(u, base) {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('//')) return (base.startsWith('https') ? 'https:' : 'http:') + s
  if (s.startsWith('/')) return base + s
  return base + '/' + s
}

async function fetchJSON(path, next) {
  const base = await getBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, { next })
  if (!res.ok) throw new Error(`CMS ${res.status} ${path}`)
  return res.json()
}

export async function getIslandScene() {
  const base = await getBaseUrl()

  try {
    const g = await fetchJSON('/api/globals/islandScene?depth=2', {
      revalidate: 30,
      tags: ['island'],
    })

    const bg = g?.background ? imgUrl(g.background) : ''

    return {
      backgroundSrc: absUrl(bg || '', base),
      maxZoomMult: Number(g?.maxZoomMult || 2.5),
    }
  } catch {
    return { backgroundSrc: absUrl('', base), maxZoomMult: 2.5 }
  }
}

export async function getIslandHotspots() {
  const base = await getBaseUrl()

  const data = await fetchJSON('/api/scene-hotspots?limit=200&depth=3&sort=order', {
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
  const base = await getBaseUrl()
  try {
    const g = await fetchJSON('/api/globals/islandBootDock?depth=0', {
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
