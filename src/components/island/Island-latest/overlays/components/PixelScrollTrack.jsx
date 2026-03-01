'use client'

import React, { useRef } from 'react'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'

export default function PixelScrollTrack({
  scrollTop,
  scrollHeight,
  clientHeight,
  trackHeight,
  onScrollTo,
  frameSrc = '/frames/scroll-frame.png',
  slice = 7,
  bw = 7,
  pad = 0,
}) {
  const trackRef = useRef(null)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScrollTop = useRef(0)

  const needsScroll = scrollHeight > clientHeight + 1
  const ratio = needsScroll ? clientHeight / scrollHeight : 1

  const THUMB_SCALE = 0.4
  const thumbH = Math.max(ratio * trackHeight * THUMB_SCALE, 10)
  const maxTop = Math.max(1, trackHeight - thumbH)
  const thumbTop = needsScroll ? (scrollTop / (scrollHeight - clientHeight)) * maxTop : 0

  const handleThumbMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!needsScroll) return

    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartScrollTop.current = scrollTop

    const onMouseMove = (ev) => {
      if (!isDragging.current) return
      const deltaY = ev.clientY - dragStartY.current
      const scrollRatio = deltaY / maxTop
      const newScrollTop = dragStartScrollTop.current + scrollRatio * (scrollHeight - clientHeight)

      onScrollTo?.(Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight)))
    }

    const onMouseUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleTrackClick = (e) => {
    if (!trackRef.current || !needsScroll) return
    if (e.target !== trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const targetTop = Math.max(0, Math.min(clickY - thumbH / 2, maxTop))
    const newScrollTop = (targetTop / maxTop) * (scrollHeight - clientHeight)
    onScrollTo?.(newScrollTop)
  }

  return (
    <PixelFrameOverlay frameSrc={frameSrc} slice={slice} bw={bw} pad={0} className="flex-shrink-0">
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative rounded-xl"
        style={{
          width: 14,
          height: trackHeight,
          backgroundColor: '#2A1616',
          cursor: needsScroll ? 'pointer' : 'default',
        }}
      >
        {needsScroll && (
          <div
            className="rounded-full"
            onMouseDown={handleThumbMouseDown}
            style={{
              position: 'absolute',
              top: thumbTop,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 2,
              height: thumbH,
              backgroundColor: '#fff',
              imageRendering: 'pixelated',
              cursor: 'grab',
              userSelect: 'none',
            }}
          />
        )}
      </div>
    </PixelFrameOverlay>
  )
}
