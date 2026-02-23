'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function SplashOverlay({
  open = false,
  minMs = 420,
  logoUrl = '/logo.gif', // عدّلها لو عندك مسار مختلف
  companyName = 'PHANTASM',
  onMinDone,
}) {
  const [minDone, setMinDone] = useState(false)
  const startRef = useRef(0)

  useEffect(() => {
    if (!open) {
      setMinDone(false)
      startRef.current = 0
      return
    }

    startRef.current = Date.now()
    setMinDone(false)

    const t = setTimeout(
      () => {
        setMinDone(true)
        onMinDone?.()
      },
      Math.max(0, Number(minMs) || 0),
    )

    return () => clearTimeout(t)
  }, [open, minMs, onMinDone])

  const show = !!open

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Logo */}
            <motion.img
              src={logoUrl}
              alt={companyName}
              draggable={false}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="w-[140px] h-auto select-none"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Text */}
            <div className="text-white/80 tracking-[0.24em] text-xs">{companyName}</div>

            {/* tiny loader */}
            <div className="mt-2 h-[2px] w-[160px] overflow-hidden bg-white/10 rounded">
              <motion.div
                className="h-full w-1/3 bg-white/60"
                initial={{ x: '-120%' }}
                animate={{ x: '320%' }}
                transition={{
                  repeat: Infinity,
                  duration: 0.9,
                  ease: 'linear',
                }}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
