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

export async function getHomeDock() {
  return fetchJSON('/api/globals/home-dock?depth=2', {
    revalidate: RV,
    tags: ['global:home-dock'],
  }).catch(() => null)
}
// ==========================
// ✅ Layout props (if needed later)
// ==========================
export async function getFrontendGlobals() {
  const [siteSettings, playerSelection, dialogSettings, homeDock] = await Promise.all([
    getSiteSettings(),
    getPlayerSelection(),
    getDialogSettings(),
    getHomeDock(),
  ])

  return { siteSettings, playerSelection, dialogSettings, homeDock }
}
