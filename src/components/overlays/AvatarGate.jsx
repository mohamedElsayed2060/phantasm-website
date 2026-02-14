'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const LS_PLAYER = 'phantasm:player'

export default function AvatarGate({ config, allowOpen = true }) {
  const enabled = config?.enabled !== false
  const players = config?.players || []
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

  const pick = (p) => {
    const payload = {
      id: p.id,
      name: p.name,
      badgeLabel: p.badgeLabel,
      avatarImage: p.avatarImage?.url,
    }
    localStorage.setItem(LS_PLAYER, JSON.stringify(payload))
    setSelected(payload)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

          {/* panel: open from center (up/down) */}
          <motion.div
            className="relative w-[min(980px,92vw)] rounded-2xl border border-white/15 bg-[#140b0b]/85 shadow-[0_30px_80px_rgba(0,0,0,0.55)] overflow-hidden"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            style={{ transformOrigin: 'center' }}
          >
            {/* header */}
            <motion.div
              className="px-6 py-4 text-center"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="inline-block rounded-md border border-white/20 bg-black/30 px-5 py-2 text-sm tracking-[0.25em] text-white/90">
                {String(title).toUpperCase()}
              </div>
            </motion.div>

            {/* grid */}
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {players.map((p, idx) => (
                  <motion.button
                    key={p.id || idx}
                    type="button"
                    onClick={() => pick(p)}
                    className="group text-left rounded-xl border border-white/15 bg-black/25 hover:bg-black/35 transition overflow-hidden"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.06, duration: 0.45 }}
                  >
                    <div className="p-3">
                      <div className="aspect-[4/3] rounded-lg border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden">
                        {p.avatarImage?.url ? (
                          <img
                            src={p.avatarImage.url}
                            alt={p.name || 'player'}
                            className="h-full w-full object-contain group-hover:scale-[1.03] transition"
                            draggable={false}
                          />
                        ) : (
                          <div className="text-white/40 text-xs">NO IMAGE</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="inline-block rounded-md bg-red-700/70 px-3 py-1 text-[11px] tracking-[0.22em] text-white">
                          {String(p.badgeLabel || p.name || 'PLAYER').toUpperCase()}
                        </div>

                        <div className="mt-2 text-[12px] leading-relaxed text-white/80 whitespace-pre-line">
                          {p.description || ''}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
