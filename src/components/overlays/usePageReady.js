'use client'

import { useEffect } from 'react'

export default function usePageReady(ready = true) {
  useEffect(() => {
    if (!ready) return
    window.dispatchEvent(new CustomEvent('phantasm:pageReady'))
  }, [ready])
}
