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
function mapProjectCard(p) {
  const singleImage = p?.singleImage ? imgUrl(p.singleImage) : ''
  return {
    id: p?.id,
    slug: p?.slug,
    ctaLabel: p?.ctaLabel,
    ctaType: p?.ctaType,
    ctaUrl: p?.ctaUrl,
    order: Number(p?.order ?? 0),
    projectName: p?.projectName,
    panelIntro: p?.panelIntro,
    singleImage: absUrl(singleImage, base),
  }
}

export async function getIslandScene() {
  try {
    const g = await fetchJSONServer('/api/globals/islandScene?depth=2', {
      revalidate: 10,
      tags: ['island'],
    })

    const bg = g?.background ? imgUrl(g.background) : ''

    const decorationsRaw = Array.isArray(g?.decorations) ? g.decorations : []
    const decorations = decorationsRaw
      .map((d) => {
        if (d?.enabled === false) return null
        const rel = d?.image ? imgUrl(d.image) : ''
        const src = absUrl(rel, base)
        if (!src) return null
        return {
          name: d?.name || '',
          order: Number(d?.order ?? 0),
          src,
          x: Number(d?.x ?? 0),
          y: Number(d?.y ?? 0),
          w: Number(d?.w ?? 120),
          h: Number(d?.h ?? 120),
          anchorX: Number(d?.anchorX ?? 0.5),
          anchorY: Number(d?.anchorY ?? 0.5),
          opacity: Number(d?.opacity ?? 1),
          rotate: Number(d?.rotate ?? 0),
          flipX: Boolean(d?.flipX),
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const ambientRaw = Array.isArray(g?.ambient) ? g.ambient : []
    const ambient = ambientRaw
      .map((a) => {
        if (a?.enabled === false) return null
        const rel = a?.image ? imgUrl(a.image) : ''
        const src = absUrl(rel, base)
        if (!src) return null
        return {
          name: a?.name || '',
          order: Number(a?.order ?? 0),
          type: a?.type || 'cloud',
          src,

          startX: Number(a?.startX ?? -10),
          startY: Number(a?.startY ?? 20),
          endX: Number(a?.endX ?? 110),
          endY: Number(a?.endY ?? 20),

          w: Number(a?.w ?? 240),
          h: Number(a?.h ?? 140),
          anchorX: Number(a?.anchorX ?? 0.5),
          anchorY: Number(a?.anchorY ?? 0.5),

          durationMs: Number(a?.durationMs ?? 22000),
          delayMs: Number(a?.delayMs ?? 0),
          loop: a?.loop !== false,

          count: Math.max(1, Number(a?.count ?? 1)),
          spreadX: Number(a?.spreadX ?? 0),
          spreadY: Number(a?.spreadY ?? 0),
          staggerMs: Number(a?.staggerMs ?? 600),

          opacity: Number(a?.opacity ?? 1),
          rotate: Number(a?.rotate ?? 0),
          flipX: Boolean(a?.flipX),
        }
      })
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return {
      backgroundSrc: absUrl(bg || '', base),
      maxZoomMult: Number(g?.maxZoomMult || 2.5),
      decorations,
      ambient,
    }
  } catch {
    return { backgroundSrc: '', maxZoomMult: 2.5, decorations: [], ambient: [] }
  }
}

export async function getIslandHotspots() {
  const data = await fetchJSONServer('/api/scene-hotspots?limit=200&depth=2&sort=order', {
    revalidate: 30,
    tags: ['island'],
  })

  const docs = Array.isArray(data?.docs) ? data.docs : []

  const mapProjectCard = (p) => {
    const singleImageRel = p?.singleImage ? imgUrl(p.singleImage) : ''
    return {
      id: p?.id,
      slug: p?.slug,
      ctaLabel: p?.ctaLabel,
      ctaType: p?.ctaType,
      ctaUrl: p?.ctaUrl,
      order: Number(p?.order ?? 0),
      projectName: p?.projectName,
      panelIntro: p?.panelIntro,
      singleImage: absUrl(singleImageRel, base),
    }
  }

  // ✅ collect category ids from hotspots (now required, but keep safe)
  const catIds = Array.from(
    new Set(
      docs
        .map((h) => {
          const c = h?.projectCategory
          if (!c) return null
          return typeof c === 'string' ? c : c?.id || null
        })
        .filter(Boolean),
    ),
  )

  // ✅ fetch ALL projects for these categories in ONE request
  const projectsByCat = {}
  if (catIds.length) {
    const qs = new URLSearchParams()
    qs.set('limit', '500')
    qs.set('depth', '1')
    qs.set('sort', 'order')
    qs.set('where[category][in]', catIds.join(','))

    const projRes = await fetchJSONServer(`/api/projects?${qs.toString()}`, {
      revalidate: 30,
      tags: ['island'],
    })

    const projDocs = Array.isArray(projRes?.docs) ? projRes.docs : []

    for (const p of projDocs) {
      const cat = p?.category
      const catId = typeof cat === 'string' ? cat : cat?.id
      if (!catId) continue
      ;(projectsByCat[catId] ||= []).push(mapProjectCard(p))
    }

    for (const id of Object.keys(projectsByCat)) {
      projectsByCat[id].sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  }

  return docs.map((h) => {
    const cat = h?.projectCategory || null
    const catId = !cat ? null : typeof cat === 'string' ? cat : cat?.id || null

    const catTitle =
      typeof cat === 'object' ? (typeof cat?.title === 'string' ? cat.title : cat?.title) || '' : ''

    const projects = catId ? projectsByCat[catId] || [] : []

    const hotspotIdleRel = h?.hotspotIdle ? imgUrl(h.hotspotIdle) : ''
    const buildingSpawnRel = h?.buildingSpawn ? imgUrl(h.buildingSpawn) : ''
    const buildingLoopRel = h?.buildingLoop ? imgUrl(h.buildingLoop) : ''

    const introPagesRaw = Array.isArray(h?.introPages) ? h.introPages : []
    const introPages = introPagesRaw
      .map((pg) => {
        const title = String(pg?.title || '').trim()
        const parasRaw = Array.isArray(pg?.paragraphs) ? pg.paragraphs : []
        const paragraphs = parasRaw.map((x) => String(x?.text || '').trim()).filter(Boolean)
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

      introEnabled: h?.introEnabled !== false,
      introPages,

      // ✅ category driven
      projectCategoryId: catId,
      projectCategoryTitle: catTitle,
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
