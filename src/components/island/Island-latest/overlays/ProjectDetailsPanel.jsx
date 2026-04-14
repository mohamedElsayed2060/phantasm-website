'use client'

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import PixelScrollTrack from '@/components/island/Island-latest/overlays/components/PixelScrollTrack'
import PixelDivider from '@/components/island/Island-latest/overlays/components/PixelDivider'
import useSplashRouter from '@/components/overlays/useSplashRouter'
import PremiumImage from '@/components/ui/PremiumImage'

// Mobile bottom sheet — slides up from bottom
const sheetV = {
  hidden: { y: '100%', opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.28, ease: [0.55, 0, 0.78, 0] } },
}

export default function ProjectDetailsPanel({
  open,
  placement = 'right',
  project,
  onClose,
  width,
}) {
  const splashRouter = useSplashRouter(750)

  const isMobileSheet = placement === 'top'
  const panelW = width || (isMobileSheet ? '100%' : 560)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = useCallback(() => {
    const slug = project?.slug || project?.id
    if (!slug) return
    window.dispatchEvent(new CustomEvent('phantasm:splashStart', { detail: { minMs: 750 } }))
    splashRouter.push(`/project-details/${slug}`)
  }, [project, splashRouter])

  // Desktop: scaleX from anchor side (handled in ProjectsOverlay via detailsV)
  // Panel itself just renders without its own enter/exit — parent wraps it in motion.div
  // Mobile: uses sheetV below

  if (!open || !project) return null

  return (
    <AnimatePresence>
      {isMobileSheet ? (
        <motion.div
          key="pdp-mobile"
          className="fixed inset-0 z-[95] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            className="absolute left-0 right-0 bottom-0"
            variants={sheetV}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 pb-3">
              <div className="mx-auto mb-2 h-1 w-14 rounded-full bg-white/25" />
              <PixelFrameOverlay
                frameSrc="/frames/dock-frame.png"
                slice={12}
                bw={12}
                pad={0}
                className="w-full"
              >
                <div className="bg-[#2b1a1a]/95 relative">
                  <div onClick={onClose} className="z-10 cursor-pointer absolute -top-3 -right-3">
                    <PremiumImage
                      src="/close.png"
                      alt="close"
                      ratio="1/1"
                      skeleton={false}
                      sizes="32px"
                      className="w-8 h-8"
                    />
                  </div>
                  <DetailsContent project={project} onGo={go} />
                </div>
              </PixelFrameOverlay>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* Desktop — parent (ProjectsOverlay) wraps this in motion.div with detailsV */
        <div key="pdp-desktop" style={{ width: panelW }} className="pointer-events-auto">
          <PixelFrameOverlay
            frameSrc="/frames/dock-frame.png"
            slice={12}
            bw={12}
            pad={0}
            className="w-full"
          >
            <div className="bg-[#2A1616] rounded-xl relative">
              <div onClick={onClose} className="z-10 cursor-pointer absolute -top-3 -right-3">
                <PremiumImage
                  src="/close.png"
                  alt="close"
                  ratio="1/1"
                  skeleton={false}
                  sizes="32px"
                  className="w-8 h-8"
                />
              </div>
              <DetailsContent project={project} onGo={go} />
            </div>
          </PixelFrameOverlay>
        </div>
      )}
    </AnimatePresence>
  )
}

function DetailsContent({ project, onGo }) {
  const title = project?.projectName || 'PROJECT'
  const text = project?.panelIntro || 'HERE IS A INTRO FOR THE ISLAND AND MORE INTRO...'
  const singleImage = project.singleImage

  const scrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 })

  const TEXT_MIN_H = 110
  const TEXT_MAX_H = 140

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () =>
      setScrollState({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [text])

  const needsScroll = scrollState.scrollHeight > scrollState.clientHeight + 1
  const handleScrollTo = useCallback((t) => {
    if (scrollRef.current) scrollRef.current.scrollTop = t
  }, [])

  return (
    <div className="flex flex-col-reverse md:flex-row gap-0 md:items-stretch">
      {/* LEFT: text */}
      <div className="flex-1 min-w-0 p-4 md:p-5 md:basis-[58%] md:flex-none">
        <div className="text-white tracking-[0.14em] text-[13px] sm:text-[15px] uppercase mb-3">
          {title}
        </div>
        <PixelDivider align="start" color="#5C3131" height={2} className="my-3" />

        <div className="flex items-start gap-[6px]">
          <div
            ref={scrollRef}
            data-overlay-scroll="true"
            className="min-w-0 flex-1"
            style={{
              minHeight: TEXT_MIN_H,
              maxHeight: TEXT_MAX_H,
              overflowY: 'scroll',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="pd-text text-white/90 text-[11px] leading-[1.7] tracking-[0.12em] uppercase whitespace-pre-wrap">
              {text}
            </div>
          </div>
          {needsScroll ? (
            <PixelScrollTrack
              scrollTop={scrollState.scrollTop}
              scrollHeight={scrollState.scrollHeight}
              clientHeight={scrollState.clientHeight}
              trackHeight={TEXT_MAX_H}
              onScrollTo={handleScrollTo}
            />
          ) : null}
        </div>

        <div className="mt-4">
          <PixelFrameOverlay
            frameSrc="/frames/botton-frame.png"
            slice={12}
            bw={10}
            pad={2}
            className="inline-block w-full"
          >
            <button
              type="button"
              onClick={onGo}
              className="w-full px-6 py-2 bg-[#7a1010] text-white font-bold tracking-[0.18em] text-[13px] uppercase"
            >
              {project?.ctaLabel}
            </button>
          </PixelFrameOverlay>
        </div>
      </div>

      {/* RIGHT: image */}
      <div className="w-full p-[2px] pr-[5px] md:basis-[42%] md:flex-none flex rounded-t-2xl md:rounded-r-2xl bg-white items-center justify-center">
        {singleImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <PremiumImage
              src={singleImage}
              alt={title}
              ratio="16/10"
              contain
              sizes="(max-width: 768px) 90vw, 35vw"
              className="w-full h-full"
              imgClassName="max-h-[220px] md:max-h-[999px]"
            />
          </div>
        ) : (
          <div className="text-white/60 text-sm">No preview</div>
        )}
      </div>
    </div>
  )
}
