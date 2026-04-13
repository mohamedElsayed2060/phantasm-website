'use client'

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { imgUrl } from '@/lib/cms'
import PixelFrameOverlay from '../ui/PixelFrameOverlay'
import PixelScrollTrack from '@/components/island/Island-latest/overlays/components/PixelScrollTrack'
import useSplashRouter from './useSplashRouter'
import PremiumImage from '@/components/ui/PremiumImage'
function sortByOrder(items = []) {
  return [...items].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
}

function isHomePath(pathname = '') {
  return pathname === '/' || pathname === '/en' || pathname === '/ar'
}

export default function HomeDockOverlay({ config, allowOpen = true }) {
  const pathname = usePathname()
  const splashRouter = useSplashRouter(750)

  const enabled = config?.enabled !== false
  const onlyHome = config?.showOnlyOnHome !== false
  const shouldRender = allowOpen !== false && enabled && (!onlyHome || isHomePath(pathname))

  const spawnMs = config?.timing?.spawnMs ?? 1200
  const staticPreRevealMs = Math.max(0, config?.timing?.staticPreRevealMs ?? 24)

  const animateIcons = config?.ui?.animateIconsOnOpen !== false
  const staggerMs = config?.ui?.iconsStaggerMs ?? 60

  const itemsAll = useMemo(() => sortByOrder(config?.items || []), [config?.items])
  const topItems = useMemo(() => itemsAll.filter((x) => (x?.slot || 'top') === 'top'), [itemsAll])
  const bottomItems = useMemo(() => itemsAll.filter((x) => x?.slot === 'bottom'), [itemsAll])

  const screens = config?.screens || []
  const getScreenByKey = (k) => screens.find((s) => s?.key === k)

  const openGifSrc = config?.assets?.openGif ? imgUrl(config.assets.openGif) : null
  const staticPhoneSrc = config?.assets?.staticPhone ? imgUrl(config.assets.staticPhone) : null
  const [phase, setPhase] = useState('closed') // closed | spawning | open
  const [screenKey, setScreenKey] = useState('grid') // grid | message/locations/phones
  const [showStaticDuringSpawn, setShowStaticDuringSpawn] = useState(false)
  const timerRef = useRef(null)
  const revealTimerRef = useRef(null)
  useEffect(() => {
    const urls = [
      '/open-mobile-icon.gif',
      '/close.png',
      '/back-icon.png',
      '/location-single-icon.png',
    ]
    urls.forEach((u) => {
      const img = new Image()
      img.src = u
    })
  }, [])
  useEffect(() => {
    const urls = [openGifSrc, staticPhoneSrc].filter(Boolean)
    urls.forEach((u) => {
      const img = new Image()
      img.src = u
      img.decoding = 'async'
      img.decode?.().catch(() => {})
    })
  }, [openGifSrc, staticPhoneSrc])

  useEffect(() => {
    if (!shouldRender) return
    const urls = itemsAll.map((it) => (it?.icon ? imgUrl(it.icon) : null)).filter(Boolean)

    urls.forEach((u) => {
      const img = new Image()
      img.src = u
      img.decoding = 'async'
      img.decode?.().catch(() => {})
    })
  }, [shouldRender, itemsAll])
  useEffect(() => {
    if (!shouldRender) return
    const urls = itemsAll.map((it) => (it?.icon ? imgUrl(it.icon) : null)).filter(Boolean)
    urls.forEach((u) => {
      const img = new Image()
      img.src = u
    })
  }, [shouldRender, itemsAll])
  useEffect(() => {
    const locked = phase !== 'closed'
    try {
      window.dispatchEvent(
        new CustomEvent('phantasm:overlayLock', {
          detail: { key: 'homeDock', locked },
        }),
      )
    } catch {}
  }, [phase])
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    }
  }, [])

  const launcherPos = config?.launcher?.position || 'bottom-left'
  const ox = config?.launcher?.offsetX ?? 20
  const oy = config?.launcher?.offsetY ?? 20

  const launcherStyle =
    launcherPos === 'bottom-right'
      ? { position: 'fixed', right: ox, bottom: oy, zIndex: 60 }
      : { position: 'fixed', left: ox, bottom: oy, zIndex: 60 }

  function open() {
    if (phase !== 'closed') return

    if (timerRef.current) clearTimeout(timerRef.current)
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)

    setScreenKey('grid')
    setShowStaticDuringSpawn(false)
    setPhase('spawning')

    const revealAt = Math.max(0, Number(spawnMs) - Number(staticPreRevealMs))

    revealTimerRef.current = setTimeout(() => {
      setShowStaticDuringSpawn(true)
    }, revealAt)

    timerRef.current = setTimeout(() => {
      setShowStaticDuringSpawn(false)
      setPhase('open')
    }, spawnMs)
  }

  function close() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current)

    setShowStaticDuringSpawn(false)
    setPhase('closed')
    setScreenKey('grid')
  }

  function onItemClick(it) {
    const type = it?.type
    if (type === 'internal') {
      const k = it?.screenKey
      if (k) setScreenKey(k)
      return
    }
    if (type === 'route' && it?.routePath) {
      close()
      splashRouter.push(it?.routePath)
      return
    }
    if (type === 'external' && it?.externalUrl) {
      window.open(it.externalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const activeScreen = screenKey !== 'grid' ? getScreenByKey(screenKey) : null

  if (!shouldRender) return null

  return (
    <>
      {/* Launcher */}
      {phase === 'closed' && (
        <button
          type="button"
          onClick={open}
          style={launcherStyle}
          className="h-14 w-14
                     flex items-center justify-center cursor-pointer"
          aria-label="Open dock"
        >
          <PremiumImage
            src="/open-mobile-icon.gif"
            alt="open-mobile"
            ratio="1/1"
            skeleton={false}
            sizes="40px"
            className="w-full h-full"
          />
        </button>
      )}

      <AnimatePresence>
        {phase !== 'closed' && (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* backdrop */}
            <div className="absolute inset-0" onClick={close} />

            {/* phone container */}
            <div className="absolute left-6 bottom-6" onClick={(e) => e.stopPropagation()}>
              {/* close X */}
              {phase === 'open' && (
                <motion.button
                  type="button"
                  onClick={close}
                  className="absolute top-8 right-9 z-10 h-8 w-8"
                  aria-label="Close dock"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  <PremiumImage
                    src="/close.png"
                    alt="close"
                    ratio="1/1"
                    skeleton={false}
                    sizes="32px"
                    className="w-8 h-8"
                  />
                </motion.button>
              )}

              {/* phone visual */}
              {(phase === 'spawning' || phase === 'open') && (openGifSrc || staticPhoneSrc) ? (
                <div className="relative w-[270px] md:w-[320px] select-none">
                  {/* static تحت - تظهر فقط قبل نهاية spawn بشوية أو في open */}
                  {(phase === 'open' || showStaticDuringSpawn) && staticPhoneSrc ? (
                    <img
                      src={staticPhoneSrc}
                      alt="Dock"
                      draggable={false}
                      className="block w-full h-auto"
                      decoding="async"
                      loading="eager"
                      fetchPriority="high"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : null}

                  {/* gif فوق أثناء spawning فقط */}
                  {phase === 'spawning' && openGifSrc ? (
                    <img
                      src={openGifSrc}
                      alt="Opening"
                      draggable={false}
                      className={`${
                        showStaticDuringSpawn
                          ? 'absolute inset-0 w-full h-full object-contain'
                          : 'block w-full h-auto'
                      }`}
                      decoding="async"
                      loading="eager"
                      fetchPriority="high"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : null}

                  {/* content layer */}
                  {phase === 'open' && staticPhoneSrc ? (
                    <div className="absolute inset-0 p-8 ps-10 pt-12">
                      <AnimatePresence mode="wait">
                        {/* GRID */}
                        {screenKey === 'grid' ? (
                          <motion.div
                            key="grid"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="h-full w-full flex flex-col"
                          >
                            {/* TOP BOX */}
                            <div className="mt-8">
                              <div className="grid grid-cols-2 gap-3 px-3">
                                {topItems.map((it, idx) => (
                                  <DockIconButton
                                    key={`${it?.type}:${it?.order}:${idx}`}
                                    item={it}
                                    idx={idx}
                                    animateIcons={animateIcons}
                                    staggerMs={staggerMs}
                                    onClick={() => onItemClick(it)}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex-1" />

                            {/* BOTTOM BOX */}
                            <div className="mb-8">
                              <div className="grid grid-cols-2 gap-3 px-3">
                                {bottomItems.map((it, idx) => (
                                  <DockIconButton
                                    key={`${it?.type}:${it?.order}:${idx}`}
                                    item={it}
                                    idx={idx}
                                    animateIcons={animateIcons}
                                    staggerMs={staggerMs}
                                    onClick={() => onItemClick(it)}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          /* SCREEN */
                          <motion.div
                            key={`screen:${screenKey}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="h-full w-full py-4 px-8 md:px-11"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setScreenKey('grid')}
                                className="inline-flex items-center gap-2"
                              >
                                <PremiumImage
                                  src="/back-icon.png"
                                  alt="back"
                                  ratio="1/1"
                                  skeleton={false}
                                  sizes="20px"
                                  className="w-5"
                                />
                                <div className="text-white/90 text-[9px] tracking-wide">
                                  {activeScreen?.title || ''}
                                </div>
                              </button>
                            </div>

                            <div className="">
                              {activeScreen?.type === 'messageForm' ? (
                                <MessageFormScreen
                                  submitLabel={activeScreen?.message?.submitLabel || 'SEND'}
                                  successText={
                                    activeScreen?.message?.successText || 'Message sent!'
                                  }
                                />
                              ) : null}

                              {activeScreen?.type === 'locationsList' ? (
                                <LocationsScreen locations={activeScreen?.locations || []} />
                              ) : null}

                              {activeScreen?.type === 'phonesList' ? (
                                <PhonesScreen phones={activeScreen?.phones || []} />
                              ) : null}

                              {!activeScreen?.type ? (
                                <div className="text-white/70 text-[10px]">
                                  Screen not found in CMS.
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* missing static asset */}
              {phase === 'open' && !staticPhoneSrc ? (
                <div className="w-[220px] p-3 rounded-lg bg-[#2A1616] border border-white/15 text-white text-xs">
                  Missing staticPhone asset in CMS.
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DockIconButton({ item, idx, animateIcons, staggerMs, onClick }) {
  const label = item?.label || ''
  const iconSrc = item?.icon ? imgUrl(item.icon) : null
  const [imgReady, setImgReady] = useState(false)

  useEffect(() => {
    if (!iconSrc) {
      setImgReady(false)
      return
    }

    let cancelled = false
    const img = new Image()
    img.src = iconSrc
    img.decoding = 'async'

    const done = () => {
      if (!cancelled) setImgReady(true)
    }

    if (img.complete) {
      done()
    } else {
      img.onload = done
      img.onerror = () => {
        if (!cancelled) setImgReady(false)
      }
      img
        .decode?.()
        .then(done)
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [iconSrc])

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1"
      initial={animateIcons ? { opacity: 0, y: 6 } : false}
      animate={animateIcons ? { opacity: 1, y: 0 } : false}
      transition={animateIcons ? { delay: (idx * staggerMs) / 1000, duration: 0.25 } : undefined}
    >
      <div className="h-15 w-15 flex items-center justify-center">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt={label}
            draggable={false}
            decoding="async"
            loading="eager"
            className={`h-full w-full object-contain select-none transition-opacity duration-150 ${
              imgReady ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ imageRendering: 'pixelated' }}
            onLoad={() => setImgReady(true)}
          />
        ) : (
          <span className="text-white/70 text-[9px]">ICON</span>
        )}
      </div>

      <div className="text-white/80 text-[9px] tracking-wide">{label}</div>
    </motion.button>
  )
}

function Input({ value, onChange, placeholder }) {
  return (
    <PixelFrameOverlay
      frameSrc="/frames/dock-frame.png"
      slice={8}
      bw={8}
      pad={0}
      className="w-full"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 text-[11px] text-white placeholder:text-white outline-none"
      />
    </PixelFrameOverlay>
  )
}

function Textarea({ value, onChange, placeholder }) {
  return (
    <PixelFrameOverlay
      frameSrc="/frames/dock-frame.png"
      slice={8}
      bw={8}
      pad={0}
      className="w-full"
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2 text-[11px] text-white placeholder:text-white outline-none resize-none"
      />
    </PixelFrameOverlay>
  )
}

function MessageFormScreen({ submitLabel = 'SEND', successText = 'Message sent!' }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const canSend = name.trim() && email.trim() && message.trim()
  async function submit() {
    if (status === 'sending') return
    if (!name.trim() || !email.trim() || !message.trim()) return

    setStatus('sending')

    try {
      const res = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'home-dock',
          name,
          email,
          phone,
          message,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })

      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Request failed')
      }

      setStatus('sent')
      setTimeout(() => setStatus('idle'), 2500)

      setName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch (e) {
      console.error(e)
      setStatus('idle')
    }
  }
  return (
    <div className="space-y-2">
      <Input value={name} onChange={setName} placeholder="NAME:" />
      <Input value={email} onChange={setEmail} placeholder="EMAIL:" />
      <Input value={phone} onChange={setPhone} placeholder="PHONE:" />
      <Textarea value={message} onChange={setMessage} placeholder="LET'S CONNECT" />

      <div className="flex justify-end">
        <PixelFrameOverlay frameSrc="/frames/title-frame-2.png" slice={10} bw={8} pad={0}>
          <button
            disabled={!canSend || status === 'sending'}
            type="button"
            onClick={submit}
            className="px-4 py-2 rounded-xl bg-[#951212] text-white text-[13px]
                     hover:bg-[#951212]/80 transition"
          >
            {status === 'sending' ? 'SENDING...' : submitLabel}
          </button>
        </PixelFrameOverlay>
      </div>

      {status === 'sent' ? (
        <div className="pb-5 pl-5 text-white/80 text-[10px]">{successText}</div>
      ) : null}
    </div>
  )
}

function LocationsScreen({ locations = [] }) {
  const boxRef = useRef(null) // ✅ wrapper height (responsive)
  const scrollRef = useRef(null)

  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    trackHeight: 0,
  })

  useLayoutEffect(() => {
    const el = scrollRef.current
    const box = boxRef.current
    if (!el || !box) return

    const update = () => {
      setScrollState({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        trackHeight: box.clientHeight,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    ro.observe(box)

    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [locations?.length])

  const needsScroll = scrollState.scrollHeight > scrollState.clientHeight + 1

  const handleScrollTo = (newScrollTop) => {
    if (scrollRef.current) scrollRef.current.scrollTop = newScrollTop
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <PixelFrameOverlay frameSrc="/frames/dock-frame.png" slice={10} bw={8} pad={0}>
        <div className="p-3 rounded bg-black text-white text-[13px] tracking-wide">LOCATIONS:</div>
      </PixelFrameOverlay>

      {/* List + Pixel Scroll */}
      <PixelFrameOverlay frameSrc="/frames/dock-frame.png" slice={10} bw={8} pad={0}>
        <div className="p-2">
          <div className="flex items-start gap-[6px]">
            {/* ✅ responsive height wrapper */}
            <div ref={boxRef} className="min-w-0 flex-1 h-[190px]  sm:h-[250px]">
              {/* ✅ scroll area fills wrapper */}
              <div
                ref={scrollRef}
                className="h-full"
                style={{
                  overflowY: 'scroll',
                  overflowX: 'hidden',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <style>{`.dock-loc::-webkit-scrollbar{display:none}`}</style>

                <div
                  data-overlay-scroll="true"
                  className="dock-loc space-y-2"
                  style={{
                    touchAction: 'pan-y',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {locations.map((loc, idx) => {
                    const isHi = !!loc?.highlight

                    const card = (
                      <div className={`p-2 flex gap-2 ${isHi ? 'bg-red-700/80' : 'bg-black/10'}`}>
                        <div className="text-white font-semibold">
                          {/* {loc?.title || ''} */}
                          <PremiumImage
                            src="/location-single-icon.png"
                            alt="location"
                            ratio="1/1"
                            skeleton={false}
                            sizes="40px"
                            className="w-10 mt-1"
                          />
                        </div>
                        <div className="mt-1 text-white/85 text-[12px] sm:text-[14px] leading-relaxed whitespace-pre-line">
                          {loc?.address || ''}
                        </div>
                      </div>
                    )

                    return isHi ? (
                      <PixelFrameOverlay
                        key={idx}
                        frameSrc="/frames/titleFrame.png"
                        slice={10}
                        bw={8}
                        pad={0}
                      >
                        {card}
                      </PixelFrameOverlay>
                    ) : (
                      <div key={idx}>{card}</div>
                    )
                  })}

                  {!locations?.length ? (
                    <div className="text-white/70 text-[10px] p-2">No locations yet.</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ✅ pixel scrollbar uses measured height */}
            {needsScroll ? (
              <PixelScrollTrack
                scrollTop={scrollState.scrollTop}
                scrollHeight={scrollState.scrollHeight}
                clientHeight={scrollState.clientHeight}
                trackHeight={scrollState.trackHeight || scrollState.clientHeight}
                onScrollTo={handleScrollTo}
              />
            ) : null}
          </div>
        </div>
      </PixelFrameOverlay>
    </div>
  )
}
function PhonesScreen({ phones = [] }) {
  return (
    <div className="space-y-2">
      <div className="text-white/90 text-[14px] tracking-wide mb-2">CALL US</div>

      <div className="space-y-3">
        {phones.map((p, idx) => (
          <div key={idx} className="space-y-1">
            <div className="text-white/80 text-[13px] sm:text-[14px] tracking-wide">
              {p?.label || ''}
            </div>
            <PixelFrameOverlay frameSrc="/frames/dock-frame.png" slice={10} bw={8} pad={0}>
              <a
                href={p?.phone ? `tel:${String(p.phone).replace(/\s+/g, '')}` : '#'}
                className="block p-3 rounded bg-black text-white text-[13px] tracking-wide"
              >
                {p?.phone || ''}
              </a>
            </PixelFrameOverlay>
          </div>
        ))}

        {!phones?.length ? <div className="text-white/70 text-[10px]">No phones yet.</div> : null}
      </div>
    </div>
  )
}
