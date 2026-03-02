'use client'

import { useRouter } from 'next/navigation'

export default function useSplashRouter(defaultMinMs = 750) {
  const router = useRouter()

  const push = (href, opts = {}) => {
    const minMs = opts.minMs ?? defaultMinMs
    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))
    router.push(href)
  }

  const replace = (href, opts = {}) => {
    const minMs = opts.minMs ?? defaultMinMs
    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))
    router.replace(href)
  }

  const back = (opts = {}) => {
    const minMs = opts.minMs ?? defaultMinMs
    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))
    router.back()
  }

  return { push, replace, back }
}
