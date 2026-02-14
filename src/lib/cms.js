// src/lib/cms.js
// ✅ IMPORTANT (Unified CMS + Web):
// Node.js `fetch()` (server-side) does NOT accept relative URLs like `/api/...`.
// This lib is imported by BOTH server components and client components, so it MUST stay
// client-safe (no `next/headers` import).
//
// - On Prod: set NEXT_PUBLIC_CMS_URL to your deployed domain (same service).
// - On Local: NEXT_PUBLIC_CMS_URL can be http://localhost:3000

const FALLBACK_ORIGIN = 'http://localhost:3000'
const DEFAULT_REVALIDATE = Number(process.env.CMS_REVALIDATE_SECONDS ?? 30)
const RV = Number.isFinite(DEFAULT_REVALIDATE) ? DEFAULT_REVALIDATE : 30

export const CMS = (
  process.env.NEXT_PUBLIC_CMS_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : FALLBACK_ORIGIN)
).replace(/\/$/, '')

export const imgUrl = (file) => {
  if (!file) return null
  if (file?.url) return file.url
  if (file?.filename) return `/media/${file.filename}`
  return null
}

export async function fetchJSON(path, options = {}) {
  const { revalidate, tags, cache: cacheOverride, ...init } = options || {}

  const url = new URL(path, CMS).toString()

  const cache =
    cacheOverride ??
    (typeof revalidate === 'number' || (Array.isArray(tags) && tags.length)
      ? 'force-cache'
      : 'no-store')

  const next =
    typeof revalidate === 'number' || (Array.isArray(tags) && tags.length)
      ? {
          ...(typeof revalidate === 'number' ? { revalidate } : null),
          ...(Array.isArray(tags) && tags.length ? { tags } : null),
          ...(init.next || {}),
        }
      : init.next

  const res = await fetch(url, {
    ...init,
    cache,
    ...(next ? { next } : null),
  })

  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`)
  return res.json()
}

// ==========================
// ✅ Globals (Phantasm)
// ==========================
export async function getSiteSettings() {
  return fetchJSON('/api/globals/site-settings?depth=2', {
    revalidate: RV,
    tags: ['global:site-settings'],
  }).catch(() => null)
}

export async function getPlayerSelection() {
  return fetchJSON('/api/globals/player-selection?depth=2', {
    revalidate: RV,
    tags: ['global:player-selection'],
  }).catch(() => null)
}

export async function getDialogSettings() {
  return fetchJSON('/api/globals/dialog-settings?depth=2', {
    revalidate: RV,
    tags: ['global:dialog-settings'],
  }).catch(() => null)
}

// ==========================
// ✅ Normalizers
// ==========================
function toNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeProject(p) {
  if (!p) return null
  const id = p.id || p._id || p.slug || p.title
  return {
    ...p,
    id,
    title: String(p.title || ''),
    tag: p.tag ? String(p.tag) : null,
    shortDescription: p.shortDescription ? String(p.shortDescription) : null,
    thumbSrc: imgUrl(p.thumb),
    order: toNum(p.order, 0),
    slug: p.slug ? String(p.slug) : null,
  }
}

function normalizeHotspot(spot) {
  if (!spot) return null

  const id = spot.id || spot._id || spot.slug || spot.label

  const intro = spot.intro || null
  const introParagraphsRaw = Array.isArray(intro?.paragraphs) ? intro.paragraphs : []
  const introParagraphs = introParagraphsRaw
    .map((x) => (x?.text ? String(x.text) : ''))
    .filter(Boolean)

  const projectsRaw = Array.isArray(spot.projects) ? spot.projects : []
  const projects = projectsRaw
    .map(normalizeProject)
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return {
    ...spot,

    id,
    label: String(spot.label || ''),

    x: toNum(spot.x, 0),
    y: toNum(spot.y, 0),
    order: toNum(spot.order, 0),

    // ✅ Hotspot icon
    hotspotIdleSrc: imgUrl(spot.icon),
    hotspotIdleW: toNum(spot.hotspotIdleW, 96),
    hotspotIdleH: toNum(spot.hotspotIdleH, 96),

    // ✅ Building assets (loop + spawn)
    buildingLoopSrc: imgUrl(spot.buildingPlaceholder),
    buildingSpawnSrc: imgUrl(spot.buildingSpawn),
    buildingW: toNum(spot.buildingW, 220),
    buildingH: toNum(spot.buildingH, 220),
    spawnDurationMs: toNum(spot.spawnDurationMs, 1400),

    // ✅ Anchor
    anchorX: toNum(spot.anchorX, 50),
    anchorY: toNum(spot.anchorY, 92),

    // ✅ Intro dialog
    introEnabled: intro?.enabled !== false,
    introTitle: intro?.title ? String(intro.title) : String(spot.label || ''),
    introPlacement: intro?.preferredPlacement || 'auto',
    introParagraphs,

    // ✅ Projects
    projects,
  }
}

// ==========================
// ✅ Home Scene data
// - scene global + hotspots collection
// ==========================
export async function getHomeSceneData() {
  const [scene, hotspotsRes] = await Promise.all([
    fetchJSON('/api/globals/scene?depth=2', {
      revalidate: RV,
      tags: ['global:scene'],
    }).catch(() => null),

    fetchJSON('/api/scene-hotspots?limit=200&sort=order&depth=3', {
      revalidate: RV,
      tags: ['collection:scene-hotspots'],
    }).catch(() => null),
  ])

  const raw = hotspotsRes?.docs ?? []
  const hotspots = Array.isArray(raw)
    ? raw
        .map(normalizeHotspot)
        .filter(Boolean)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : []

  return {
    scene,
    hotspots,
  }
}
export async function getProjectBySlug(slug, opts = {}) {
  const safeSlug = encodeURIComponent(String(slug || '').trim())

  const url = `/api/projects?where[slug][equals]=${safeSlug}&limit=1&depth=3`

  const data = await fetchJSON(url, {
    revalidate: opts.revalidate ?? 60,
    tags: opts.tags ?? ['projects'],
  })

  const doc = data?.docs?.[0] || null
  return doc
}

// ==========================
// ✅ Layout props (if needed later)
// ==========================
export async function getFrontendGlobals() {
  const [siteSettings, playerSelection, dialogSettings] = await Promise.all([
    getSiteSettings(),
    getPlayerSelection(),
    getDialogSettings(),
  ])
  return { siteSettings, playerSelection, dialogSettings }
}
