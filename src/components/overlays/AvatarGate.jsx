'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'

const LS_PLAYER = 'phantasm:player'

export default function AvatarGate({ config, allowOpen = true }) {
  const enabled = config?.enabled !== false
  const players = Array.isArray(config?.players) ? config.players : []
  const title = config?.title || 'Pick Your Player'

  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PLAYER)
      if (raw) setSelected(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  const isOpen = allowOpen && enabled && ready && !selected && players.length > 0
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'avatarGate', locked: Boolean(isOpen) },
        }),
      )
    } catch {}
  }, [isOpen])
  const pick = (p) => {
    const payload = {
      id: p.id,
      name: p.name,
      badgeLabel: p.badgeLabel,
      avatarImage: p.avatarImage?.url,
    }
    localStorage.setItem(LS_PLAYER, JSON.stringify(payload))
    setSelected(payload)
    try {
      window.dispatchEvent(new CustomEvent('phantasm:playerSelected', { detail: payload }))
    } catch {}
  }

  const ease = [0.22, 1, 0.36, 1]

  // ── Title: slides in from bottom, stops right above cards ──
  const titleV = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
  }

  // ── Cards: unfold from vertical center outward, after title ──
  const cardV = {
    hidden: { opacity: 0, scaleY: 0 },
    show: (i) => ({
      opacity: 1,
      scaleY: 1,
      transition: {
        delay: 0.5 + i * 0.08, // title finishes ~0.4s, then cards start
        duration: 0.55,
        ease,
      },
    }),
    exit: (i) => ({
      opacity: 0,
      scaleY: 0,
      transition: { delay: i * 0.03, duration: 0.2, ease },
    }),
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="absolute inset-0 z-[1] overflow-y-auto"
            data-overlay-scroll="true"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <div className="min-h-full flex items-center justify-center py-8 px-4">
              {' '}
              <div className="flex flex-col items-center gap-3 w-[min(1200px,100%)]">
                {/* ── Title ── */}
                <motion.div variants={titleV} initial="hidden" animate="show" className="w-full">
                  <PixelFrameOverlay
                    frameSrc="/frames/title-fram.png"
                    slice={9}
                    bw={9}
                    pad={0}
                    className="w-full text-center"
                  >
                    <div className="bg-[#951212] rounded-xl md:p-0 py-3">
                      <p className="text-white text-[22px] sm:text-[45px] whitespace-nowrap text-center">
                        {String(title).toUpperCase()}{' '}
                      </p>
                    </div>
                  </PixelFrameOverlay>
                </motion.div>

                {/* ── Cards grid ── */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-0 md:px-5 px-1">
                  {players.map((p, idx) => {
                    const img = p.avatarImage?.url
                    const label = p.badgeLabel || p.name || 'PLAYER'
                    const desc = p.description || ''

                    return (
                      <motion.button
                        key={p.id || idx}
                        type="button"
                        custom={idx}
                        variants={cardV}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        onClick={() => pick(p)}
                        // whileHover={{
                        //   y: -1,
                        //   transition: { type: 'spring', stiffness: 240, damping: 24 },
                        // }}
                        // whileTap={{
                        //   y: 1,
                        //   scale: 0.98,
                        //   transition: { type: 'spring', stiffness: 200, damping: 28 },
                        // }}
                        className="origin-center rounded-md bg-[#2A1616] text-left cursor-pointer
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        style={{ transformOrigin: '50% 50%' }}
                      >
                        <PixelFrameOverlay
                          frameSrc="/frames/CardFrame.png"
                          slice={9}
                          bw={9}
                          pad={5}
                          className="flex items-start md:inline-block "
                        >
                          {/* image */}

                          <PixelFrameOverlay
                            frameSrc="/frames/imgFrame.png"
                            slice={9}
                            bw={9}
                            pad={5}
                            className="my-[3px] sm:mt-[4px] mx-[4px] md:w-auto w-[500px]"
                          >
                            <div
                              className="h-[150px] sm:h-[190px] flex items-center justify-center
                                     bg-black/25 border-b border-white/15 overflow-hidden"
                            >
                              {img ? (
                                <img
                                  src={img}
                                  alt={p.name || 'player'}
                                  draggable={false}
                                  className="h-[150px] sm:h-[190px] w-auto"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              ) : (
                                <div className="text-white/40 text-xs">NO IMAGE</div>
                              )}
                            </div>

                            {/* badge */}
                            <PixelFrameOverlay
                              frameSrc="/frames/titleFrame.png"
                              slice={9}
                              bw={9}
                              pad={0}
                            >
                              <div className="bg-[#b01010] mb-1">
                                <div className="md:px-3 p-1 py-2 text-center text-white  tracking-[0.18em] md:text-[15px] text-[12px]">
                                  {String(label).toUpperCase()}
                                </div>
                              </div>
                            </PixelFrameOverlay>
                          </PixelFrameOverlay>

                          {/* description */}
                          <div className="px-4 py-5 md:text-[15px] text-[13px] leading-relaxed text-white/85 whitespace-pre-line">
                            {desc}
                          </div>
                        </PixelFrameOverlay>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
