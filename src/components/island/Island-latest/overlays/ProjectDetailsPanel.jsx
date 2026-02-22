'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import PixelScrollTrack from '@/components/island/Island-latest/overlays/components/PixelScrollTrack'
import PixelDivider from '@/components/island/Island-latest/overlays/components/PixelDivider'

export default function ProjectDetailsPanel({
  open,
  placement = 'right', // 'right' | 'left' | 'top'
  project,
  onClose,
  width,
}) {
  const router = useRouter()
  if (!open || !project) return null

  const isMobileSheet = placement === 'top' // عندكم الموبايل بيرسل top
  const panelW = width || (isMobileSheet ? '100%' : 560)

  // ✅ ESC يقفل
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = () => {
    const slug = project?.slug || project?.id
    if (!slug) return
    router.push(`/project-details/${slug}`)
  }

  // Animations
  const desktopV = {
    hidden: {
      opacity: 0,
      x: placement === 'left' ? -12 : 12,
      y: 0,
      scale: 0.99,
      filter: 'blur(6px)',
    },
    show: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.22 } },
    exit: {
      opacity: 0,
      x: placement === 'left' ? -10 : 10,
      scale: 0.99,
      filter: 'blur(6px)',
      transition: { duration: 0.18 },
    },
  }

  const sheetV = {
    hidden: { y: 28, opacity: 0, filter: 'blur(6px)' },
    show: { y: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.24 } },
    exit: { y: 28, opacity: 0, filter: 'blur(6px)', transition: { duration: 0.18 } },
  }

  return (
    <AnimatePresence>
      {/* ✅ Mobile Bottom Sheet */}
      {isMobileSheet ? (
        <motion.div
          className="fixed inset-0 z-[95] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* sheet */}
          <motion.div
            className="absolute left-0 right-0 bottom-0"
            variants={sheetV}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 pb-3">
              {/* handle */}
              <div className="mx-auto mb-2 h-1 w-14 rounded-full bg-white/25" />

              <PixelFrameOverlay
                frameSrc="/frames/dock-frame.png"
                slice={12}
                bw={12}
                pad={0}
                className="w-full "
              >
                <div className="bg-[#2b1a1a]/95 relative">
                  {/* close */}
                  <div onClick={onClose} className="z-10 cursor-pointer absolute -top-3 -right-3">
                    <img src="/close.png" alt="close" className="w-8 h-8" />
                  </div>

                  <DetailsContent project={project} onGo={go} />
                </div>
              </PixelFrameOverlay>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* ✅ Desktop side panel */
        <motion.div
          className="pointer-events-auto"
          style={{ width: panelW }}
          variants={desktopV}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <PixelFrameOverlay
            frameSrc="/frames/dock-frame.png"
            slice={12}
            bw={12}
            pad={0}
            className="w-full"
          >
            <div className="bg-[#2A1616] rounded-xl relative">
              <div onClick={onClose} className="z-10 cursor-pointer absolute -top-3 -right-3">
                <img src="/close.png" alt="close" className="w-8 h-8" />
              </div>

              <DetailsContent project={project} onGo={go} />
            </div>
          </PixelFrameOverlay>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DetailsContent({ project, onGo }) {
  const title = project?.title || 'PROJECT'
  const text =
    project?.detailsText ||
    'HERE IS A INTRO FOR THE ISLAND AND MORE INTRO HERE IS A INTRO FOR THE ISLAND AND MORE INTRO...'

  const images = Array.isArray(project?.images)
    ? project.images.filter(Boolean)
    : project?.previewImage
      ? [project.previewImage]
      : []

  // ✅ Scroll plumbing for PixelScrollTrack
  const scrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  })

  // ✅ heights (عدّلهم براحتك)
  const TEXT_MIN_H = 110
  const TEXT_MAX_H = 140
  const TRACK_H = TEXT_MAX_H

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

  const handleScrollTo = (newScrollTop) => {
    if (scrollRef.current) scrollRef.current.scrollTop = newScrollTop
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-0 md:items-stretch">
      {/* LEFT: text */}
      <div className="flex-1 min-w-0 p-4 md:p-5 md:basis-[58%] md:flex-none">
        <div className="text-white  tracking-[0.14em] text-[13px] sm:text-[15px] uppercase mb-3">
          {title}
        </div>

        <PixelDivider align="start" color="#5C3131" height={2} className="my-3" />

        {/* ✅ text area + pixel scrollbar */}
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
            <style>{`.pd-text::-webkit-scrollbar{display:none}`}</style>
            <div className="pd-text text-white/90 text-[11px] leading-[1.7] tracking-[0.12em] uppercase whitespace-pre-wrap">
              {text}
            </div>
          </div>

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

      {/* RIGHT: images */}
      <div className="w-full p-[2px] pr-[5px] md:basis-[42%] md:flex-none flex md:rounded-r-2xl bg-white items-center justify-center">
        {images.length ? (
          <div className="w-full h-full flex items-center justify-center">
            {/* ✅ صورة واحدة تملا المساحة */}
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full max-h-[220px] md:max-h-[999px] object-contain drop-shadow-xl"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-white/60 text-sm">No preview</div>
        )}
      </div>
    </div>
  )
}
