'use client'

import { AnimatePresence, motion } from 'framer-motion'

function Arrow({ dir = 'left' }) {
  const rot =
    dir === 'left'
      ? 'rotate(180deg)'
      : dir === 'up'
        ? 'rotate(-90deg)'
        : dir === 'down'
          ? 'rotate(90deg)'
          : 'none'

  return (
    <div
      style={{
        transform: rot,
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export default function HintArrows({ panState, hintPulseOn }) {
  return (
    <AnimatePresence>
      {panState?.any && hintPulseOn && (
        <>
          {panState.left && (
            <motion.div
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 0.9, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.35 }}
              style={{ color: 'white' }}
            >
              <Arrow dir="left" />
            </motion.div>
          )}

          {panState.right && (
            <motion.div
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 0.9, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.35 }}
              style={{ color: 'white' }}
            >
              <Arrow dir="right" />
            </motion.div>
          )}

          {panState.up && (
            <motion.div
              className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.35 }}
              style={{ color: 'white' }}
            >
              <Arrow dir="up" />
            </motion.div>
          )}

          {panState.down && (
            <motion.div
              className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              style={{ color: 'white' }}
            >
              <Arrow dir="down" />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
