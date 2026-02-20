'use client'

export default function PixelFrameOverlay({
  children,
  className = '',
  frameSrc = '/ui/frame.png',
  slice = 16, // سمك البوردر في الصورة (px)
  bw = 16, // سمك البوردر على العنصر
  pad = 0,
  repeat = 'stretch', // أو 'repeat' لو الحواف قابلة للتكرار
}) {
  return (
    <div
      className={`relative ${className} rounded-xl`}
      style={{ padding: pad, backgroundColor: '#2A1616' }}
    >
      {children}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
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
