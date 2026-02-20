// src/components/island/Island-latest/storage.js

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getPlayerId() {
  try {
    const raw = localStorage.getItem('phantasm:player')
    const data = raw ? JSON.parse(raw) : null
    return data?.id || 'guest'
  } catch {
    return 'guest'
  }
}

function keyForPlayer() {
  return `phantasm:island:discovered:${getPlayerId()}`
}

export function loadDiscoveredIds() {
  if (typeof window === 'undefined') return new Set()

  const arr = safeParse(localStorage.getItem(keyForPlayer()), [])
  if (!Array.isArray(arr)) return new Set()

  // ✅ نخزن ids كـ string عشان يبقى ثابت حتى لو CMS بيرجع string ids
  return new Set(arr.map((x) => String(x)))
}

export function saveDiscoveredIds(setOrArray) {
  if (typeof window === 'undefined') return

  const set =
    setOrArray instanceof Set ? setOrArray : new Set(Array.isArray(setOrArray) ? setOrArray : [])

  const arr = Array.from(set).map((x) => String(x))
  localStorage.setItem(keyForPlayer(), JSON.stringify(arr))
}

/**
 * اختياري: clear progress
 */
export function clearDiscoveredIds() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(keyForPlayer())
}
