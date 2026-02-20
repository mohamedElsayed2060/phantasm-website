'use client'

import React from 'react'

export default function PixelDivider({
  width = 'calc(100% - 18px)',
  align = 'center', // 'center' | 'start' | 'end'
  color = 'rgba(255,255,255,0.06)',
  height = 1,
  className = '',
}) {
  const justifyContent = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center'

  return (
    <div className={`w-full flex ${className}`} style={{ justifyContent }}>
      <div style={{ width, height, backgroundColor: color }} />
    </div>
  )
}
