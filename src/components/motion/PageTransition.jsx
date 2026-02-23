'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }) {
  const pathname = usePathname()
  const [key, setKey] = useState(0)

  // ✅ نعمل trigger بسيط للأنيميشن بدون transform/filter وبدون remount للصفحة نفسها
  useEffect(() => {
    setKey((k) => k + 1)
  }, [pathname])

  return (
    <motion.div
      // ✅ ده key على wrapper نفسه، بس الأنيميشن opacity فقط (مفيش transform)
      key={key}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.52, ease: 'easeOut' }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
