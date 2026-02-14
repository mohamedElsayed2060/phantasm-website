'use client'

import { useEffect, useMemo, useRef } from 'react'

/**
 * AnimatedAsset
 * Supports:
 * - type: 'webp' | 'gif' | 'apng' => rendered as <img>
 * - type: 'spritesheet' => rendered as <div> with CSS steps animation
 *
 * Props:
 *  asset: {
 *    type, src,
 *    w, h,
 *    durationMs?, // for non-loop assets (spawn)
 *    frames?, fps?, frameW?, frameH?, // for spritesheet
 *    loop?: boolean
 *  }
 *  pixelated?: boolean
 *  onDone?: () => void         // for spawn end
 *  style?: React.CSSProperties
 *  className?: string
 */
export default function AnimatedAsset({ asset, pixelated = true, onDone, className = '', style }) {
  const doneTimerRef = useRef(null)

  const type = asset?.type || 'webp'
  const src = asset?.src || null
  const w = asset?.w || 80
  const h = asset?.h || 80

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
      doneTimerRef.current = null
    }
  }, [])

  // When we have a non-loop "spawn" with durationMs, call onDone
  useEffect(() => {
    if (!asset || !onDone) return
    const isSprite = type === 'spritesheet'
    const duration =
      asset?.durationMs ||
      (isSprite && asset?.frames && asset?.fps
        ? Math.round((asset.frames / asset.fps) * 1000)
        : null)

    if (!duration) return
    if (asset.loop) return

    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    doneTimerRef.current = setTimeout(() => {
      doneTimerRef.current = null
      onDone?.()
    }, duration)

    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
      doneTimerRef.current = null
    }
  }, [asset, onDone, type])

  const pixelStyle = useMemo(
    () =>
      pixelated
        ? {
            imageRendering: 'pixelated',
            WebkitFontSmoothing: 'none',
          }
        : null,
    [pixelated],
  )

  // SPRITESHEET mode
  if (type === 'spritesheet' && src) {
    const frames = asset?.frames || 1
    const fps = asset?.fps || 12
    const frameW = asset?.frameW || w
    const frameH = asset?.frameH || h
    const durationMs = asset?.durationMs || Math.round((frames / fps) * 1000)

    // CSS steps animation
    const animName = `ss_${hashString(src)}_${frames}_${fps}`
    const bgW = frameW * frames

    return (
      <>
        <style jsx>{`
          @keyframes ${animName} {
            from {
              background-position: 0px 0px;
            }
            to {
              background-position: -${bgW}px 0px;
            }
          }
        `}</style>

        <div
          className={className}
          style={{
            width: frameW,
            height: frameH,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${bgW}px ${frameH}px`,
            animation: `${animName} ${durationMs}ms steps(${frames}) ${
              asset?.loop === false ? '1' : 'infinite'
            }`,
            ...pixelStyle,
            ...style,
          }}
        />
      </>
    )
  }

  // IMG mode (webp/gif/apng)
  if (src) {
    return (
      <img
        src={src}
        alt={asset?.alt || ''}
        draggable={false}
        className={className}
        style={{
          width: w,
          height: h,
          display: 'block',
          pointerEvents: 'none',
          ...pixelStyle,
          ...style,
        }}
      />
    )
  }

  // Fallback placeholder
  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.15)',
        ...style,
      }}
    />
  )
}

function hashString(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h)
}
