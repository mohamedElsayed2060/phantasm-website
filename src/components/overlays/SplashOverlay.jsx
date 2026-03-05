'use client'

import { AnimatePresence, motion } from 'framer-motion'

const EASE_IN = [0.4, 0, 0.2, 1] // close (nice)
const EASE_OUT = [0.4, 0, 1, 1] // open (snappier)

export default function SplashOverlay({
  open = false,
  logoUrl = '/logo.gif',
  companyName = 'PHANTASM',
  isInstant = false,
}) {
  // نفس فكرة الموبايل لكن على الكل:
  // - initial: لو instant => مقفول جاهز (clip 0)
  //            لو لا => يبدأ مفتوح (clip من النص) ثم يقفل
  // - animate: يقفل بالكامل
  // - exit: يفتح للأطراف (يرجع clip للنص)

  const curtainVariants = {
    initial: (instant) => ({
      clipPath: instant ? 'inset(0% 0% 0% 0%)' : 'inset(0% 50% 0% 50%)',
    }),
    animate: {
      clipPath: 'inset(0% 0% 0% 0%)',
      transition: { duration: 0.7, ease: EASE_IN },
    },
    exit: {
      clipPath: 'inset(0% 50% 0% 50%)',
      transition: { duration: 0.8, ease: EASE_OUT },
    },
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[10050] flex items-center justify-center overflow-hidden"
        >
          {/* dim + blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-2xl"
          />
          <div className="absolute inset-0 z-[15] pointer-events-none bg-red-500/6" />
          {/* ✅ صورة واحدة cover + clip-path animation */}
          <motion.div
            custom={isInstant}
            variants={curtainVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 z-10"
            style={{
              backgroundImage: 'url(/intro-82.jpg)',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              willChange: 'clip-path, filter, transform',
              // filter: 'blur(1px)', // ✅ بلور خفيف جدًا
              // transform: 'scale(1.02)', // ✅ يمنع حواف البلور
            }}
          />

          {/* Logo + loader */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-20 flex flex-col items-center gap-6"
          >
            <img
              src={logoUrl}
              alt={companyName}
              className="w-[180px] md:w-[500px] h-auto select-none"
              draggable={false}
              style={{ imageRendering: 'pixelated' }}
            />

            <div className="h-[1px] w-[140px] md:w-[200px] overflow-hidden bg-white/10 rounded-full">
              <motion.div
                className="h-full bg-white/60"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
