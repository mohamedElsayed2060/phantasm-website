'use client'

import { useEffect, useMemo, useState } from 'react'

const safeJson = (s) => {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// لو الصورة جاية من API بمسار نسبي، خليه absolute على نفس الدومين
const normalizeSrc = (src) => {
  const s = String(src || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s
  // relative path -> same origin
  return s.startsWith('/') ? s : `/${s}`
}

export default function DialogFrame({
  title,
  subtitle,
  children,

  showClose = true,
  onClose,

  // optional: { name, avatarImage }
  player: playerProp,

  // figma frames (png with borders)
  avatarPanelBg, // "/ui/dialog/avatar-panel.png"
  textPanelBg, // "/ui/dialog/text-panel.png"

  // sizes: المربع يصغر على الشاشات الصغيرة
  avatarBox = { base: 140, sm: 150, md: 160 }, // px
  avatarImg = { base: 56, sm: 64, md: 76 }, // px

  // padding inside text frame
  textPaddingClass = 'px-4 py-4',
}) {
  const [playerLS, setPlayerLS] = useState(null)

  useEffect(() => {
    if (playerProp) return
    const raw = localStorage.getItem('phantasm:player')
    setPlayerLS(raw ? safeJson(raw) : null)
  }, [playerProp])

  const player = playerProp || playerLS
  const name = String(player?.name || '').trim()
  const avatarSrc = normalizeSrc(player?.avatarImage)

  const avatarWClass = useMemo(() => {
    const b = avatarBox.base ?? 88
    const sm = avatarBox.sm ?? 104
    const md = avatarBox.md ?? 128
    return `w-[${b}px] sm:w-[${sm}px] md:w-[${md}px]`
  }, [avatarBox])

  const avatarImgClass = useMemo(() => {
    const b = avatarImg.base ?? 56
    const sm = avatarImg.sm ?? 64
    const md = avatarImg.md ?? 76
    return `w-[${b}px] h-[${b}px] sm:w-[${sm}px] sm:h-[${sm}px] md:w-[${md}px] md:h-[${md}px]`
  }, [avatarImg])

  return (
    <div className="relative w-full">
      {/* Close */}
      {showClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-[10] grid place-items-center w-9 h-9 rounded-full bg-black/40 border border-white/20 backdrop-blur hover:bg-black/55"
        >
          <span className="text-white/90 text-xl leading-none">×</span>
        </button>
      ) : null}

      {/* ✅ لازم جنب بعض دائمًا */}
      <div className="flex items-start md:items-stretch">
        {/* Left: Avatar frame (square, fixed) */}
        <div className="relative shrink-0 aspect-square w-[80px] sm:w-[150px] md:w-[160px] overflow-visible">
          {/* Background */}
          {avatarPanelBg ? (
            <img
              src={avatarPanelBg}
              alt=""
              className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
              draggable={false}
              style={{ zIndex: 1 }}
            />
          ) : null}

          {/* Content */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-2"
            style={{ zIndex: 2 }}
          >
            {avatarSrc ? (
              <div className="relative overflow-hidden rounded-md w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] md:w-[76px] md:h-[76px]">
                <img
                  src={avatarSrc}
                  alt={name || 'avatar'}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
              </div>
            ) : null}

            {name ? (
              <div className="mt-2 text-white text-xs sm:text-sm font-semibold leading-none text-center">
                {name}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Text frame (fills remaining width, height auto) */}
        <div className="relative flex-1 min-w-0 md:p-3">
          {/* ✅ نخلي الخلفية تتمدد مع الكونتنت: object-fill */}
          {textPanelBg ? (
            <img
              src={textPanelBg}
              alt=""
              className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
              draggable={false}
            />
          ) : null}

          {/* content فوق الخلفية */}
          <div className={`relative ${textPaddingClass}`}>
            {title || subtitle ? (
              <div className="min-w-0">
                {title ? <div className="text-white/95 text-sm font-semibold">{title}</div> : null}
                {subtitle ? (
                  <div className="mt-0.5 text-white/60 text-[11px]">{subtitle}</div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3 text-white/85 text-[13px] leading-relaxed">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
