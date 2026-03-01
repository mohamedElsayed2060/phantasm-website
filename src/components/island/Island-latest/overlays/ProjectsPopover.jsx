'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import PixelScrollTrack from '@/components/island/Island-latest/overlays/components/PixelScrollTrack'

function ListDivider({ width = 'calc(100% - 26px)', align = 'center' }) {
  return (
    <div className="w-full flex" style={{ justifyContent: align }}>
      <div style={{ width, height: 2, backgroundColor: '#5C3131' }} />
    </div>
  )
}

export default function ProjectsPopover({
  title,
  categoryTitle, // ✅ NEW
  projects = [],
  placement = 'top',
  onClose,
  onProjectClick,
  onMeasuredHeight,
  activeProjectId,
  fixedHeight = 180,
}) {
  const ref = useRef(null)
  const scrollRef = useRef(null)
  const [measuredOnce, setMeasuredOnce] = useState(false)
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  })

  useLayoutEffect(() => {
    if (!ref.current) return
    const h = ref.current.getBoundingClientRect().height || 0
    if (h && (!measuredOnce || onMeasuredHeight)) {
      onMeasuredHeight?.(h)
      setMeasuredOnce(true)
    }
  }, [projects, measuredOnce, onMeasuredHeight, categoryTitle])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      setScrollState({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })
    }

    const raf = requestAnimationFrame(update)
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [projects, categoryTitle])

  const handleScrollTo = (newScrollTop) => {
    if (scrollRef.current) scrollRef.current.scrollTop = newScrollTop
  }

  const showHeader = Boolean(String(categoryTitle || '').trim())
  const HEADER_H = showHeader ? 44 : 0

  const LIST_H = Math.max(120, fixedHeight - HEADER_H)
  const TRACK_H = LIST_H

  const needsScroll = scrollState.scrollHeight > scrollState.clientHeight + 1

  return (
    <div ref={ref} className="flex flex-row items-end gap-[4px]">
      <PixelFrameOverlay
        frameSrc="/frames/dock-frame.png"
        slice={12}
        bw={13}
        pad={0}
        className="flex flex-col overflow-hidden"
      >
        {/* ✅ Header */}
        {showHeader ? (
          <div className="px-2 pt-2" style={{ backgroundColor: '#2A1616' }}>
            <PixelFrameOverlay
              frameSrc="/frames/title-fram.png"
              slice={12}
              bw={9}
              pad={2}
              className="w-full"
            >
              <div
                className="px-3 py-[7px] text-center rounded-xl mb-1"
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  backgroundColor: '#7a1010',
                }}
              >
                {categoryTitle}
              </div>
            </PixelFrameOverlay>
          </div>
        ) : null}

        {/* List */}
        <div
          ref={scrollRef}
          data-overlay-scroll="true"
          className="py-3"
          style={{
            width: 230,
            height: LIST_H,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            backgroundColor: '#2A1616',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <style>{`.psp-list::-webkit-scrollbar{display:none}`}</style>

          <div className="psp-list flex flex-col">
            {projects.length ? (
              projects.map((p, idx) => {
                const isActive = String(p.id) === String(activeProjectId)
                const isLast = idx === projects.length - 1

                const ItemButton = (
                  <button
                    type="button"
                    onClick={() => onProjectClick?.(p)}
                    className="w-full text-center px-3 py-[7px] transition-colors cursor-pointer"
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#ffffff',
                      backgroundColor: isActive ? '#7a1010' : 'transparent',
                    }}
                  >
                    {p.projectName}
                  </button>
                )

                return (
                  <div key={p.id} className="w-full">
                    {isActive ? (
                      <div className="mx-[5px]">
                        <PixelFrameOverlay
                          frameSrc="/frames/titleFrame.png"
                          slice={4}
                          bw={4}
                          pad={0}
                          className="w-full"
                        >
                          {ItemButton}
                        </PixelFrameOverlay>
                      </div>
                    ) : (
                      ItemButton
                    )}

                    {!isLast ? <ListDivider width="calc(100% - 30px)" align="center" /> : null}
                  </div>
                )
              })
            ) : (
              <div
                className="px-3 py-4 text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}
              >
                No projects
              </div>
            )}
          </div>
        </div>
      </PixelFrameOverlay>

      {needsScroll ? (
        <PixelScrollTrack
          scrollTop={scrollState.scrollTop}
          scrollHeight={scrollState.scrollHeight}
          clientHeight={scrollState.clientHeight}
          trackHeight={TRACK_H}
          onScrollTo={handleScrollTo}
        />
      ) : null}
    </div>
  )
}
