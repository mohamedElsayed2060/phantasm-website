'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function SplashOverlay({ open = true, config, logoUrl, companyName, onDone }) {
  const minMs = Number(config?.minMs || 1400)

  const startRef = useRef(0)
  const readyRef = useRef(false)
  const doneRef = useRef(false)

  useEffect(() => {
    // ✅ لو مش مفتوح: صفّر كل حاجة وسيب
    if (!open) {
      startRef.current = 0
      readyRef.current = false
      doneRef.current = false
      return
    }

    startRef.current = Date.now()
    readyRef.current = false
    doneRef.current = false

    const tryFinish = () => {
      if (doneRef.current) return
      if (!readyRef.current) return

      const elapsed = Date.now() - startRef.current
      const remain = Math.max(0, minMs - elapsed)

      window.setTimeout(() => {
        if (doneRef.current) return
        doneRef.current = true
        onDone?.()
      }, remain)
    }

    const onBootReady = () => {
      readyRef.current = true
      tryFinish()
    }

    window.addEventListener('phantasm:bootReady', onBootReady)

    // ✅ safety: لو الحدث حصل قبل تركيب الليسنر
    try {
      if (sessionStorage.getItem('phantasm:bootReady') === '1') {
        readyRef.current = true
        tryFinish()
      }
    } catch {}

    return () => {
      window.removeEventListener('phantasm:bootReady', onBootReady)
    }
  }, [open, minMs, onDone])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          {logoUrl ? (
            <img
              src={logoUrl || '/logo.gif'}
              alt={companyName || 'Logo'}
              style={{ width: 180, height: 'auto' }}
              draggable={false}
            />
          ) : (
            <div className="text-white/90 text-xl tracking-[0.25em]">
              {String(companyName || 'PHANTASM').toUpperCase()}
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
