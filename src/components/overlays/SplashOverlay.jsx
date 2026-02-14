'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const SS_SPLASH_SEEN = 'phantasm:splashSeen'

export default function SplashOverlay({ config, logoUrl, companyName, onDone }) {
  const enabled = config?.enabled !== false
  const minDurationMs = Number(config?.minDurationMs || 1200)
  const blur = config?.backgroundBlur ?? '12px'
  const showEveryVisit = config?.showEveryVisit ?? true

  const [open, setOpen] = useState(false)
  const doneCalledRef = useRef(false)

  const callDoneOnce = () => {
    if (doneCalledRef.current) return
    doneCalledRef.current = true
    onDone?.()
  }

  useEffect(() => {
    // If disabled: immediately consider it "done"
    if (!enabled) {
      callDoneOnce()
      return
    }

    // If only once per session and already seen: skip and mark done
    if (!showEveryVisit) {
      const seen = sessionStorage.getItem(SS_SPLASH_SEEN)
      if (seen) {
        callDoneOnce()
        return
      }
      sessionStorage.setItem(SS_SPLASH_SEEN, '1')
    }

    setOpen(true)

    const t = setTimeout(() => {
      setOpen(false)
      callDoneOnce()
    }, minDurationMs)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, minDurationMs, showEveryVisit])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            style={{ backdropFilter: `blur(${blur})` }}
          />

          <motion.div
            className="relative flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="logo"
                className="h-[20] w-[350px] object-contain"
                draggable={false}
              />
            ) : null}

            {/* {companyName ? (
              <div className="text-white text-lg tracking-[0.25em]">{companyName}</div>
            ) : null} */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
