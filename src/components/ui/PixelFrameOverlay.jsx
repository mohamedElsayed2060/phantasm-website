'use client'

export default function PixelFrameOverlay({
  children,
  className = '',
  frameSrc = '/ui/frame.png',
  slice = 16,
  bw = 16,
  pad = 0,
  repeat = 'stretch',
  bg = '#2A1616',
  roundedClassName = 'rounded-xl',
  frameOpacity = 1, // ✅ NEW
}) {
  return (
    <div
      className={`relative ${className} ${roundedClassName}`}
      style={{ padding: pad, backgroundColor: bg }}
    >
      {children}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: frameOpacity, // ✅ هنا
          borderStyle: 'solid',
          borderWidth: bw,
          borderImageSource: `url("${frameSrc}")`,
          borderImageSlice: slice,
          borderImageRepeat: repeat,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}
