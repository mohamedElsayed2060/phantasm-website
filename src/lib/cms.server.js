// src/lib/cms.server.js

import { headers } from 'next/headers'

function getServerBaseUrl() {
  const base = process.env.NEXT_PUBLIC_CMS_URL || process.env.NEXT_PUBLIC_SITE_URL

  if (base) return base.replace(/\/$/, '')

  // ✅ runtime fallback (Reverse proxy safe)
  const h = headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || 'http'
  if (!host) return 'http://localhost:3000'
  return `${proto}://${host}`
}

export async function fetchJSONServer(
  path,
  { revalidate = 30, tags, cache, method = 'GET', headers, body } = {},
) {
  const baseUrl = getServerBaseUrl()
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`

  const res = await fetch(url, {
    method,
    body,
    headers: { ...(headers || {}) },
    next: { revalidate, tags },
    cache,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`fetchJSONServer failed ${res.status} ${res.statusText} for ${url}\n${text}`)
  }

  return res.json()
}
export async function getProjectBySlugServer(slug) {
  const s = String(slug || '').trim()
  if (!s) return null

  // نفس فكرة cms.js غالبًا: نجيب من collection projects بالـ slug
  const data = await fetchJSONServer(
    `/api/projects?where[slug][equals]=${encodeURIComponent(s)}&depth=3&limit=1`,
    { revalidate: 30, tags: ['projects', `project:${s}`] },
  )

  const doc = data?.docs?.[0]
  return doc || null
}
