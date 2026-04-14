'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import PremiumImage from '@/components/ui/PremiumImage'

const LS_PLAYER = 'phantasm:player'
const CONTENT_REVEAL_DELAY_MS = 820

// ─── CSS keyframes injected once ────────────────────────────────────────────
const PIXEL_STYLES = `
  @keyframes pixel-rows-wipe {
    0%   { clip-path: inset(0 0 100% 0); }
    12%  { clip-path: inset(0 0 87%  0); }
    25%  { clip-path: inset(0 0 72%  0); }
    37%  { clip-path: inset(0 0 55%  0); }
    50%  { clip-path: inset(0 0 40%  0); }
    62%  { clip-path: inset(0 0 27%  0); }
    75%  { clip-path: inset(0 0 14%  0); }
    87%  { clip-path: inset(0 0 4%   0); }
    100% { clip-path: inset(0 0 0%   0); }
  }

  @keyframes px-bounce {
    0%   { transform: translateY(0px);  }
    50%  { transform: translateY(-3px); }
    100% { transform: translateY(0px);  }
  }

  @keyframes px-bounce-exit {
    0%   { transform: translateY(-3px); }
    100% { transform: translateY(0px);  }
  }

  .avatar-card {
    animation-fill-mode: both;
    animation-timing-function: steps(8, end);
  }

  .avatar-card:hover .avatar-card__inner {
    animation: px-bounce 0.55s steps(4, end) infinite;
  }

  .avatar-card:not(:hover) .avatar-card__inner {
    animation: px-bounce-exit 0.18s steps(3, end) forwards;
  }

  .avatar-card:hover {
    outline: 2px solid rgba(224, 80, 80, 0.5);
    outline-offset: 3px;
  }
`

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('avatargate-px-styles')) return
  const tag = document.createElement('style')
  tag.id = 'avatargate-px-styles'
  tag.textContent = PIXEL_STYLES
  document.head.appendChild(tag)
}

// ─── Animation variants ──────────────────────────────────────────────────────

// Overlay backdrop — plain fade, short
const overlayV = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
}

// Title — calm slide + fade, no blur
const titleV = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: 0.18 },
  },
}

// Cards wrapper — fade in, triggers children
const cardsWrapV = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { delay: 0.3, duration: 0.2 },
  },
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AvatarGate({ config, allowOpen = true }) {
  const enabled = config?.enabled !== false
  const players = Array.isArray(config?.players) ? config.players : []
  const title = config?.title || 'Pick Your Player'

  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState(null)
  const [contentReady, setContentReady] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')

  // Inject styles once
  useEffect(() => {
    injectStyles()
  }, [])

  // Typewriter for title — starts when content becomes ready
  useEffect(() => {
    if (!contentReady) {
      setTypedTitle('')
      return
    }
    const full = String(title).toUpperCase()
    setTypedTitle('')
    let i = 0
    const startDelay = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        i += 1
        setTypedTitle(full.slice(0, i))
        if (i >= full.length) window.clearInterval(interval)
      }, 65)
    }, 350)
    return () => {
      window.clearTimeout(startDelay)
    }
  }, [contentReady, title])

  // Restore saved player
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_PLAYER)
      if (raw) setSelected(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  const isOpen = allowOpen && enabled && ready && !selected && players.length > 0

  // Overlay lock event
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'avatarGate', locked: Boolean(isOpen) },
        }),
      )
    } catch {}
  }, [isOpen])

  // Preload avatars
  useEffect(() => {
    if (!isOpen) return
    players
      .map((p) => p?.avatarImage?.url)
      .filter(Boolean)
      .forEach((u) => {
        const img = new Image()
        img.src = u
        img.decode?.().catch(() => {})
      })
  }, [isOpen, players])

  // Content reveal — waits for splash to close
  useEffect(() => {
    if (!isOpen) {
      setContentReady(false)
      return
    }

    let tid = null

    const reveal = () => {
      tid = window.setTimeout(() => setContentReady(true), CONTENT_REVEAL_DELAY_MS)
    }

    try {
      if (sessionStorage.getItem('phantasm:splashFullyClosed') === '1') {
        reveal()
        return () => {
          if (tid) window.clearTimeout(tid)
        }
      }
    } catch {}

    setContentReady(false)

    const onClose = () => reveal()
    const onReopen = () => {
      if (tid) window.clearTimeout(tid)
      setContentReady(false)
    }

    window.addEventListener('phantasm:splashFullyClosed', onClose)
    window.addEventListener('phantasm:splashOpened', onReopen)

    return () => {
      window.removeEventListener('phantasm:splashFullyClosed', onClose)
      window.removeEventListener('phantasm:splashOpened', onReopen)
      if (tid) window.clearTimeout(tid)
    }
  }, [isOpen])

  // Pick player
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

  // Card entrance: staggered pixel-rows-wipe via CSS
  // Each card gets a slightly later animation-delay
  const cardEntranceStyle = (idx) => ({
    animation: contentReady
      ? `pixel-rows-wipe 0.55s steps(8, end) ${1.1 + idx * 0.18}s both`
      : 'none',
    willChange: 'clip-path',
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          variants={overlayV}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Scroll container */}
          <div
            className="absolute inset-0 z-[1] overflow-y-auto"
            data-overlay-scroll="true"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <div className="min-h-full flex items-center justify-center px-4 py-8">
              <div className="flex w-[min(1200px,100%)] flex-col items-center gap-3">
                <AnimatePresence mode="wait">
                  {contentReady ? (
                    <motion.div
                      key="avatar-gate-content"
                      className="w-full"
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                    >
                      {/* ── Title ── */}
                      <motion.div variants={titleV} className="w-full">
                        <PixelFrameOverlay
                          frameSrc="/frames/title-fram.png"
                          slice={9}
                          bw={9}
                          pad={0}
                          className="w-full text-center"
                        >
                          <div className="rounded-xl bg-[#951212] py-3 md:p-0">
                            <p className="whitespace-nowrap text-center text-[22px] text-white sm:text-[45px]">
                              {typedTitle}
                              {typedTitle.length < String(title).toUpperCase().length && (
                                <span
                                  className="animate-pulse opacity-60"
                                  style={{ fontSize: '0.55em', verticalAlign: 'middle' }}
                                >
                                  █
                                </span>
                              )}
                            </p>
                          </div>
                        </PixelFrameOverlay>
                      </motion.div>

                      {/* ── Cards grid ── */}
                      <motion.div
                        variants={cardsWrapV}
                        className="mt-6 grid w-full grid-cols-1 items-stretch gap-0 px-1 sm:grid-cols-2 md:px-5 lg:grid-cols-4"
                      >
                        {players.map((p, idx) => {
                          const img = p.avatarImage?.url
                          const label = p.badgeLabel || p.name || 'PLAYER'
                          const desc = p.description || ''

                          return (
                            <div
                              key={p.id || idx}
                              className="avatar-card origin-center cursor-pointer"
                              style={cardEntranceStyle(idx)}
                              onClick={() => pick(p)}
                            >
                              {/* Inner wrapper — receives hover bounce */}
                              <div className="avatar-card__inner h-full">
                                <button
                                  type="button"
                                  className="h-full w-full rounded-md bg-[#2A1616] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                >
                                  <PixelFrameOverlay
                                    frameSrc="/frames/CardFrame.png"
                                    slice={9}
                                    bw={9}
                                    pad={5}
                                    className="flex h-full items-start md:inline-block"
                                  >
                                    <PixelFrameOverlay
                                      frameSrc="/frames/imgFrame.png"
                                      slice={9}
                                      bw={9}
                                      pad={5}
                                      className="mx-[4px] my-[3px] w-[130px] shrink-0 sm:mt-[4px] md:w-auto"
                                    >
                                      <div className="flex h-[150px] items-center justify-center overflow-hidden border-b border-white/15 bg-black/25 sm:h-[190px]">
                                        {img ? (
                                          <PremiumImage
                                            src={img}
                                            alt={p.name || 'player'}
                                            ratio="1/1"
                                            contain
                                            skeleton={false}
                                            pixelated
                                            sizes="(max-width: 640px) 130px, 190px"
                                            className="h-[150px] w-[130px] sm:h-[190px] sm:w-[190px]"
                                          />
                                        ) : (
                                          <div className="text-xs text-white/40">NO IMAGE</div>
                                        )}
                                      </div>

                                      <PixelFrameOverlay
                                        frameSrc="/frames/titleFrame.png"
                                        slice={9}
                                        bw={9}
                                        pad={0}
                                      >
                                        <div className="mb-1 bg-[#b01010]">
                                          <div className="p-1 py-2 text-center text-[12px] tracking-[0.18em] text-white md:px-3 md:text-[15px]">
                                            {String(label).toUpperCase()}
                                          </div>
                                        </div>
                                      </PixelFrameOverlay>
                                    </PixelFrameOverlay>

                                    <div className="whitespace-pre-line px-4 py-5 text-[13px] leading-relaxed text-white/85 md:text-[15px]">
                                      {desc}
                                    </div>
                                  </PixelFrameOverlay>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div key="avatar-gate-empty-stage" className="h-[420px] w-full" />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
