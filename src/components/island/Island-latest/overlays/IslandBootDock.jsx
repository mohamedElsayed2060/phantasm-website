'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'

// ─── Typewriter hook ─────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function IslandBootDock({ open, onClose, player, pages, typingSpeed = 14 }) {
  const safePages = useMemo(() => (Array.isArray(pages) ? pages.filter(Boolean) : []), [pages])

  const [pageIndex, setPageIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setPageIndex(0)
      setAnimKey((k) => k + 1)
      setClosing(false)
    }
  }, [open])

  // text 0.72s + avatar delay 0.56s + avatar 0.80s ≈ 1440ms
  const EXIT_DURATION = 1440

  const handleClose = (e) => {
    e?.stopPropagation()
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      onClose?.()
    }, EXIT_DURATION)
  }

  const hasPrev = pageIndex > 0
  const hasNext = pageIndex < safePages.length - 1

  const currentText = String(safePages[pageIndex] ?? '')
  const { out, typing } = useTypewriter(currentText, { speed: typingSpeed, enabled: open })

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight') setPageIndex((i) => Math.min(safePages.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setPageIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, safePages.length])

  if (!open || !safePages.length) return null

  const playerName = player?.name || 'PLAYER'
  const avatarSrc = player?.avatarSrc

  const wrapV = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
    },
    exit: {
      opacity: 0,
      y: 8,
      transition: { duration: 0.18, delay: 1.1 },
    },
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dock-root"
          className="fixed left-1/2 bottom-4 -translate-x-1/2 z-[90] pointer-events-auto"
          variants={wrapV}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <div
            className="flex items-start gap-0"
            style={{ width: 'min(860px, calc(100vw - 24px))' }}
          >
            {/* ════════════════════════════════════════════
                AVATAR BOX — whole box scales up from bottom
            ════════════════════════════════════════════ */}
            <div
              key={`av-${animKey}`}
              className={closing ? 'dock-avatar-exit' : 'dock-avatar-enter'}
            >
              <PixelFrameOverlay
                frameSrc="/frames/dock-frame.png"
                slice={12}
                bw={12}
                pad={0}
                innerClassName="overflow-hidden"
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <div className="w-full flex justify-center items-start overflow-hidden">
                    <img
                      src={avatarSrc}
                      alt={playerName}
                      draggable={false}
                      className="block h-[74px] sm:h-[84px] w-auto scale-[1.6] origin-top"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  <PixelFrameOverlay
                    frameSrc="/frames/titleFrame.png"
                    slice={12}
                    bw={12}
                    pad={0}
                    className="w-full mt-1"
                  >
                    <div className="bg-[#b01010] px-2 py-1 text-center rounded-lg">
                      <div className="text-white font-bold tracking-[0.12em] text-[10px] sm:text-[11px] uppercase">
                        {playerName}
                      </div>
                    </div>
                  </PixelFrameOverlay>
                </div>
              </PixelFrameOverlay>
            </div>

            {/* ════════════════════════════════════════════
                TEXT BOX — whole box scales from right → left
            ════════════════════════════════════════════ */}
            <div
              key={`tx-${animKey}`}
              className={`relative flex-1 min-w-0 ${closing ? 'dock-text-exit' : 'dock-text-enter'}`}
            >
              {/* Typing indicator */}
              <AnimatePresence>
                {typing && (
                  <motion.div
                    className="absolute -top-4 left-4 z-[5]"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="px-2 py-1 rounded-md bg-white/90 text-black text-[10px] font-bold">
                      …
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
                  {/* Text */}
                  <div className="pb-2">
                    <div className="text-white/90 text-[10px] sm:text-[11px] leading-[1.55] tracking-[0.14em] uppercase whitespace-pre-wrap">
                      {out}
                      {typing && <span className="inline-block w-[8px]">▮</span>}
                    </div>
                  </div>

                  {/* Nav arrows */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={!hasPrev}
                      onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                      className="flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Previous"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="13"
                        viewBox="0 0 13 11"
                        fill="none"
                      >
                        <g filter="url(#filter0_d_2099_2972)">
                          <path
                            d="M2.99148 3.03374L2.98301 2.03378L3.98298 2.02532L3.97452 1.02535L4.97448 1.01689L4.96602 0.0169245L6.96595 4.89876e-07L6.97441 0.999965L11.9742 0.957655L12.0419 8.95737L7.0421 8.99968L7.05057 9.99964L5.05064 10.0166L5.04218 9.0166L4.04221 9.02506L4.03375 8.0251L3.03379 8.03356L3.02532 7.0336L2.02536 7.04206L2.0169 6.0421L1.01693 6.05056L1.00001 4.05063L1.99997 4.04217L1.99151 3.0422L2.99148 3.03374Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <filter
                            id="filter0_d_2099_2972"
                            x="0"
                            y="0"
                            width="12.042"
                            height="10.0166"
                            filterUnits="userSpaceOnUse"
                            colorInterpolationFilters="sRGB"
                          >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                              in="SourceAlpha"
                              type="matrix"
                              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                              result="hardAlpha"
                            />
                            <feOffset dx="-1" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix
                              type="matrix"
                              values="0 0 0 0 0.753456 0 0 0 0 0.578534 0 0 0 0 0.578534 0 0 0 1 0"
                            />
                            <feBlend
                              mode="normal"
                              in2="BackgroundImageFix"
                              result="effect1_dropShadow_2099_2972"
                            />
                            <feBlend
                              mode="normal"
                              in="SourceGraphic"
                              in2="effect1_dropShadow_2099_2972"
                              result="shape"
                            />
                          </filter>
                        </defs>
                      </svg>
                    </button>

                    <button
                      type="button"
                      disabled={!hasNext}
                      onClick={() => setPageIndex((i) => Math.min(safePages.length - 1, i + 1))}
                      className="flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Next"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="13"
                        viewBox="0 0 12 10"
                        fill="none"
                      >
                        <g filter="url(#filter0_d_24_8783)">
                          <path
                            d="M10 7L10 8L9 8L9 9L8 9L8 10L6 10L6 9L1 9L1 1L6 1L6 -2.62268e-07L8 -1.74846e-07L8 1L9 1L9 2L10 2L10 3L11 3L11 4L12 4L12 6L11 6L11 7L10 7Z"
                            fill="white"
                          />
                        </g>
                        <defs>
                          <filter
                            id="filter0_d_24_8783"
                            x="0"
                            y="0"
                            width="12"
                            height="10"
                            filterUnits="userSpaceOnUse"
                            colorInterpolationFilters="sRGB"
                          >
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix
                              in="SourceAlpha"
                              type="matrix"
                              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                              result="hardAlpha"
                            />
                            <feOffset dx="-1" />
                            <feComposite in2="hardAlpha" operator="out" />
                            <feColorMatrix
                              type="matrix"
                              values="0 0 0 0 0.753456 0 0 0 0 0.578534 0 0 0 0 0.578534 0 0 0 1 0"
                            />
                            <feBlend
                              mode="normal"
                              in2="BackgroundImageFix"
                              result="effect1_dropShadow_24_8783"
                            />
                            <feBlend
                              mode="normal"
                              in="SourceGraphic"
                              in2="effect1_dropShadow_24_8783"
                              result="shape"
                            />
                          </filter>
                        </defs>
                      </svg>
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleClose}
                    className="z-5 cursor-pointer absolute -top-6 -right-6 flex items-center gap-1"
                    aria-label="Close dock"
                  >
                    <img src="/close.png" alt="close" />
                  </button>
                </div>
              </PixelFrameOverlay>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
