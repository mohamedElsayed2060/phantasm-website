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

    // لو لينك جديد/تاب جديد أو modifier keys سيبه طبيعي
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest?.target === '_blank') {
      return
    }

    // منع Link الافتراضي علشان نتحكم
    e.preventDefault()

    // افتح السلاش
    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs } }))

    // روح للروت
    if (replace) router.replace(href)
    else router.push(href)
  }

  return (
    <Link href={href} prefetch={prefetch} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  )
}
