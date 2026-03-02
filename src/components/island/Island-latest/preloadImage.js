const cache = new Map()

export function preloadImage(src) {
  const url = String(src || '').trim()
  if (!url) return Promise.resolve(false)

  if (cache.has(url)) return cache.get(url)

  const p = new Promise((resolve) => {
    const img = new Image()
    img.src = url

    img.onload = async () => {
      try {
        // decode helps reduce flash on swap
        if (img.decode) await img.decode()
      } catch {}
      resolve(true)
    }

    img.onerror = () => resolve(false)
  })

  cache.set(url, p)
  return p
}

export function preloadMany(urls = []) {
  const list = (urls || [])
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean)
  return Promise.all(list.map(preloadImage))
}
