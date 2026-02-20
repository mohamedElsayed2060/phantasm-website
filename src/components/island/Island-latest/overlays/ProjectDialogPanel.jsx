'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'

// --- Hook لعمل تأثير الكتابة (Typewriter) ---
function useTypewriter(text, { speed = 14, enabled = true } = {}) {
  const [out, setOut] = useState('')
  const [typing, setTyping] = useState(false)
  const rafRef = useRef(null)
  const idxRef = useRef(0)
  const textRef = useRef('')

  useEffect(() => {
    textRef.current = String(text ?? '')
    idxRef.current = 0
    setOut('')
    if (!enabled) {
      setOut(textRef.current)
      setTyping(false)
      return
    }

    setTyping(true)
    const tick = () => {
      const full = textRef.current
      idxRef.current += 1
      setOut(full.slice(0, idxRef.current))
      if (idxRef.current >= full.length) {
        setTyping(false)
        rafRef.current = null
        return
      }
      rafRef.current = window.setTimeout(tick, speed)
    }

    rafRef.current = window.setTimeout(tick, speed)
    return () => {
      if (rafRef.current) window.clearTimeout(rafRef.current)
      rafRef.current = null
    }
  }, [text, speed, enabled])

  return { out, typing }
}

export default function ProjectDialogPanel({
  open,
  project,
  player,
  onClose,
  onRequestDetails,
  typingSpeed = 14,
}) {
  const pages = useMemo(() => {
    const p = project?.pages
    if (Array.isArray(p) && p.length) return p.filter(Boolean)
    if (project?.text) return [String(project.text)]
    return []
  }, [project])

  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    if (open) setPageIndex(0)
  }, [open, project?.id])

  const hasPrev = pageIndex > 0
  const hasNext = pageIndex < pages.length - 1
  const isLastPage = pageIndex === pages.length - 1

  const currentText = String(pages[pageIndex] ?? '')
  const { out, typing } = useTypewriter(currentText, { speed: typingSpeed, enabled: open })

  const dockV = {
    hidden: { opacity: 0, y: 16, scale: 0.98, filter: 'blur(4px)' },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    },
    exit: { opacity: 0, y: 12, scale: 0.985, filter: 'blur(4px)', transition: { duration: 0.2 } },
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed left-1/2 bottom-4 -translate-x-1/2 z-[90] pointer-events-auto"
        variants={dockV}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        <div className="flex items-start gap-0" style={{ width: 'min(860px, calc(100vw - 24px))' }}>
          {/* --- AVATAR BOX --- */}
          <PixelFrameOverlay
            frameSrc="/frames/dock-frame.png"
            slice={12}
            bw={12}
            pad={0}
            innerClassName="overflow-hidden"
          >
            <div className="flex md:w-auto w-[100px] flex-wrap p-[6px] px-[6px] mb-1">
              <div className="w-full flex justify-center items-start overflow-hidden">
                <img
                  src={player?.avatarSrc || '/default-avatar.png'}
                  alt={player?.name}
                  className="block h-[74px] sm:h-[84px] w-auto scale-[1.6] origin-top"
                  style={{ imageRendering: 'pixelated' }}
                  draggable={false}
                />
              </div>
              <PixelFrameOverlay
                frameSrc="/frames/titleFrame.png"
                slice={12}
                bw={12}
                pad={0}
                className="w-full"
              >
                <div className="bg-[#b01010] px-2 py-1 text-center rounded-lg">
                  <div className="text-white font-bold tracking-[0.12em] text-[10px] sm:text-[11px] uppercase truncate">
                    {player?.name || 'PLAYER'}
                  </div>
                </div>
              </PixelFrameOverlay>
            </div>
          </PixelFrameOverlay>

          {/* --- TEXT BOX --- */}
          <div className="relative flex-1 min-w-0">
            {/* مؤشر الـ Typing */}
            <AnimatePresence>
              {typing && (
                <motion.div
                  className="absolute -top-4 left-4 z-[5]"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                >
                  <div className="px-2 py-1 rounded-md bg-white/90 text-black text-[10px] font-bold">
                    ...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <PixelFrameOverlay
              frameSrc="/frames/dock-frame.png"
              slice={12}
              bw={12}
              pad={10}
              className="w-full"
              bgClass="bg-[#2b1a1a]/95"
              innerClassName="overflow-hidden"
            >
              <div className="relative min-h-[105px] p-3 md:p-5">
                {/* النص */}
                <div className="pb-2">
                  <div className="text-white/90 text-[10px] sm:text-[11px] leading-[1.55] tracking-[0.14em] uppercase whitespace-pre-wrap">
                    {out}
                    {typing && <span className="inline-block w-[8px] animate-pulse">▮</span>}
                  </div>
                </div>

                {/* --- أزرار التحكم --- */}
                <div className="absolute bottom-2 right-2 flex items-center gap-3">
                  {/* زر السابق */}
                  <button
                    type="button"
                    disabled={!hasPrev}
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    className="hover:scale-110 active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="15" height="13" viewBox="0 0 13 11" fill="none">
                      <path
                        d="M2.99148 3.03374L2.98301 2.03378L3.98298 2.02532L3.97452 1.02535L4.97448 1.01689L4.96602 0.0169245L6.96595 4.89876e-07L6.97441 0.999965L11.9742 0.957655L12.0419 8.95737L7.0421 8.99968L7.05057 9.99964L5.05064 10.0166L5.04218 9.0166L4.04221 9.02506L4.03375 8.0251L3.03379 8.03356L3.02532 7.0336L2.02536 7.04206L2.0169 6.0421L1.01693 6.05056L1.00001 4.05063L1.99997 4.04217L1.99151 3.0422L2.99148 3.03374Z"
                        fill="white"
                      />
                    </svg>
                  </button>

                  {/* زر التالي أو Details في آخر page */}
                  {isLastPage ? (
                    // آخر page → زرار Details
                    <button
                      type="button"
                      onClick={() => onRequestDetails?.(project)}
                      className="flex items-center gap-1 px-2 py-[3px] rounded-md bg-white/15 hover:bg-white/25 active:scale-95 transition-all border border-white/20"
                    >
                      <span className="text-white text-[9px] font-bold tracking-widest uppercase">
                        Details
                      </span>
                      {/* سهم صغير */}
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M0 0h2v2H0zm2 2h2v2H2zm2 2h2v2H4zM2 4h2v2H2zM0 6h2v2H0z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  ) : (
                    // مش آخر page → زرار Next عادي
                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => setPageIndex((i) => i + 1)}
                      className="hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
                    >
                      <svg width="15" height="13" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M10 7L10 8L9 8L9 9L8 9L8 10L6 10L6 9L1 9L1 1L6 1L6 -2.62268e-07L8 -1.74846e-07L8 1L9 1L9 2L10 2L10 3L11 3L11 4L12 4L12 6L11 6L11 7L10 7Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* زر الإغلاق */}
                <div onClick={onClose} className="z-10 cursor-pointer absolute -top-6 -right-6">
                  <img src="/close.png" alt="close" className="w-8 h-8" />
                </div>
              </div>
            </PixelFrameOverlay>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
