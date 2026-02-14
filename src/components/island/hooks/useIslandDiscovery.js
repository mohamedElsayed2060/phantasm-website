'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

const safeJSONParse = (v, fallback) => {
  try {
    const parsed = JSON.parse(v)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export default function useIslandDiscovery(sceneKey = 'phantasm-v1') {
  const storageKey = useMemo(() => `island:${sceneKey}:discovered`, [sceneKey])
  const [map, setMap] = useState({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(storageKey)
    const initial = raw ? safeJSONParse(raw, {}) : {}
    setMap(initial && typeof initial === 'object' ? initial : {})
  }, [storageKey])

  const persist = useCallback(
    (next) => {
      setMap(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {}
    },
    [storageKey],
  )

  const isDiscovered = useCallback((id) => !!map?.[id], [map])

  const discover = useCallback(
    (id) => {
      if (!id) return
      if (map?.[id]) return
      persist({ ...(map || {}), [id]: true })
    },
    [map, persist],
  )

  const reset = useCallback(() => {
    persist({})
  }, [persist])

  return { isDiscovered, discover, reset, discoveredMap: map }
}
