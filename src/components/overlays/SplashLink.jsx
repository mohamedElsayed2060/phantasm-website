'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

function waitForCurtainClosed(timeoutMs = 1200) {
  return new Promise((resolve) => {
    let done = false

    const finish = () => {
      if (done) return
      done = true
      cleanup()
      resolve()
    }

    const onClosed = () => finish()

    const cleanup = () => {
      try {
        window.removeEventListener('phantasm:curtainClosed', onClosed)
      } catch {}
      clearTimeout(t)
    }

    try {
      window.addEventListener('phantasm:curtainClosed', onClosed, { once: true })
    } catch {}

    const t = setTimeout(() => finish(), timeoutMs)
  })
}

export default function SplashLink({
  href,
  children,
  minMs = 750,
  replace = false,
  prefetch = true,
  className,
  onClick,
  ...rest
}) {
  const router = useRouter()

  const handleClick = async (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest?.target === '_blank') {
      return
    }

    e.preventDefault()

    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))

    await waitForCurtainClosed()

    if (replace) router.replace(href)
    else router.push(href)
  }

  return (
    <Link href={href} prefetch={prefetch} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  )
}
