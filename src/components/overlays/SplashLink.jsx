'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

  const handleClick = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return

    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest?.target === '_blank') {
      return
    }

    e.preventDefault()

    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))

    if (replace) router.replace(href)
    else router.push(href)
  }

  return (
    <Link href={href} prefetch={prefetch} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  )
}
