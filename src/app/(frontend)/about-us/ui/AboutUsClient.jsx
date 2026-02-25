'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import SplashLink from '@/components/overlays/SplashLink'
import { imgUrl } from '@/lib/cms'

import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'

function useTypewriter(text, { speed = 14 } = {}) {
  const [out, setOut] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef(null)
  const runIdRef = useRef(0)

  useEffect(() => {
    runIdRef.current += 1
    const runId = runIdRef.current

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const full = String(text ?? '')
    setOut('')
    setIsTyping(Boolean(full.length))

    let i = 0
    const tick = () => {
      if (runId !== runIdRef.current) return

      i += 1
      setOut(full.slice(0, i))

      if (i >= full.length) {
        setIsTyping(false) // ✅ خلص
        return
      }

      timeoutRef.current = setTimeout(tick, speed)
    }

    if (full.length) {
      timeoutRef.current = setTimeout(tick, speed)
    } else {
      setIsTyping(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [text, speed])

  return { out, isTyping }
}
const FRAME_MAIN = '/frames/dock-frame.png' // بدّلها لو اسمها مختلف عندك
const FRAME_THIN = '/frames/titleFrame.png' // بدّلها لو اسمها مختلف عندك

export default function AboutUsClient({ data }) {
  const backHref = data?.backHref || '/'
  const backImg = imgUrl(data?.backButtonImage)
  const pageRef = useRef(null)

  const companyLabel = data?.companyLabel || 'PHANTASM'
  const missionText = data?.missionText || ''

  const teamTitle = data?.teamTitle || 'TEAM'
  const members = Array.isArray(data?.members) ? data.members : []

  const defaultKey = data?.defaultMemberKey
  const defaultMember = useMemo(() => {
    const found = members.find((m) => m?.key === defaultKey)
    return found || members[0] || null
  }, [members, defaultKey])

  const [selectedKey, setSelectedKey] = useState(defaultMember?.key || '')
  const [hoveredKey, setHoveredKey] = useState(null)
  const selectedMember = useMemo(() => {
    return members.find((m) => m?.key === selectedKey) || defaultMember || null
  }, [members, selectedKey, defaultMember])
  // ensure default selection on first paint / data changes
  useEffect(() => {
    if (!members.length) return
    const found = members.find((m) => m?.key === defaultKey)
    const nextKey = (found || members[0])?.key
    if (nextKey) setSelectedKey(nextKey)
  }, [defaultKey, members])

  const { out: typedBio, isTyping } = useTypewriter(selectedMember?.bioText || '', { speed: 12 })
  // ====== images for member details (realPhoto optional) ======
  const detailsImg =
    imgUrl(selectedMember?.realPhoto) ||
    imgUrl(selectedMember?.avatarStatic) ||
    imgUrl(selectedMember?.avatarAnimated) ||
    null

  const isFinePointer = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(pointer: fine)').matches
  return (
    <div
      ref={pageRef}
      className="h-[100dvh] w-full overflow-y-auto bg-[#120707] text-white px-4 py-6 outline-none"
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y',
      }}
    >
      {' '}
      {/* ====== TOP: back button + mission box ====== */}
      <div className="max-w-[1400px] mx-auto">
        {/* Back button (PNG) */}
        <div className="mb-4">
          <SplashLink href={backHref} className="inline-block">
            {backImg ? (
              <img
                src={backImg}
                alt="Back"
                draggable={false}
                className="h-auto w-[40px] md:w-[44px]"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="text-xs opacity-70">Back</div>
            )}
          </SplashLink>
        </div>

        {/* Mission box (company label left + text right) */}
        <PixelFrameOverlay
          frameSrc={'/frames/about-us-first-frame.png'}
          slice={14}
          bw={14}
          pad={0}
          bg="#1B0C0C"
          className="mb-4"
        >
          <div className="flex flex-wrap items-center gap-3 p-5 md:gap-6 md:p-12">
            <div className="shrink-0 text-[20px] md:text-[26px] tracking-[4px] font-semibold">
              {companyLabel}
            </div>

            <div className="flex-1 text-[15px] md:text-[17px] leading-[1.55] opacity-90 whitespace-pre-line">
              {missionText}
            </div>
          </div>
        </PixelFrameOverlay>

        {/* ====== TEAM TITLE BAR ====== */}
        <PixelFrameOverlay
          frameSrc={'/frames/title-fram.png'}
          slice={12}
          bw={12}
          pad={0}
          bg="#951212"
          className="mb-0"
        >
          <div className="p-5 text-center text-[20px] tracking-[3px] font-semibold">
            {teamTitle}
          </div>
        </PixelFrameOverlay>

        {/* ====== TEAM SLIDER ====== */}
        <PixelFrameOverlay
          frameSrc={FRAME_MAIN}
          slice={12}
          bw={12}
          pad={13}
          bg="#951212"
          className="mb-4 pt-5"
        >
          <div
            className="pt-3 md:pt-6"
            onWheelCapture={(e) => {
              if (!isFinePointer()) return // ✅ موبايل: سيبه
              if (e.ctrlKey) return
              e.preventDefault()
              const el = pageRef.current
              if (el) el.scrollTop += e.deltaY
            }}
          >
            <Splide
              options={{
                type: 'slide',
                perPage: 8,
                perMove: 1,
                gap: '5px',
                pagination: false,
                arrows: false,
                drag: true, // بدل 'free' (free بتزود تدخلها في wheel/touch)
                focus: 0,
                breakpoints: {
                  1024: { perPage: 5 },
                  768: { perPage: 4 },
                  520: { perPage: 3.5 },
                },
              }}
              className="pt-3 md:pt-6 about-team-splide"
            >
              {members.map((m) => {
                const isActive = m?.key === selectedKey
                const isHover = m?.key === hoveredKey

                const staticSrc = imgUrl(m?.avatarStatic)
                const animSrc = imgUrl(m?.avatarAnimated)

                // ✅ الصورة تتحرك لو hover أو active
                const showSrc = isActive || isHover ? animSrc || staticSrc : staticSrc

                return (
                  <SplideSlide key={m?.key}>
                    <TeamItem
                      frameSrc={FRAME_THIN}
                      isActive={isActive}
                      isHover={isHover}
                      imgSrc={showSrc}
                      onEnter={() => setHoveredKey(m?.key)}
                      onLeave={() => setHoveredKey(null)}
                      onClick={() => setSelectedKey(m?.key)}
                    />
                  </SplideSlide>
                )
              })}
            </Splide>
          </div>
        </PixelFrameOverlay>

        {/* ====== MEMBER DETAILS (left image+name, right typewriter) ====== */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0">
          {/* Left box */}
          <PixelFrameOverlay frameSrc={FRAME_MAIN} slice={16} bw={16} pad={10} bg="#1B0C0C">
            <div
              onWheelCapture={(e) => {
                if (!isFinePointer()) return // ✅ موبايل: سيبه
                if (e.ctrlKey) return
                e.preventDefault()
                const el = pageRef.current
                if (el) el.scrollTop += e.deltaY
              }}
            >
              <div className="flex flex-col">
                <div className="w-full aspect-[1/1] overflow-hidden flex items-center justify-center bg-black/20 about-no-pan">
                  {detailsImg ? (
                    <img
                      src={detailsImg}
                      alt={selectedMember?.name || 'Member'}
                      draggable={false}
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="text-xs opacity-70">No Image</div>
                  )}
                </div>

                <div className="mt-3">
                  <PixelFrameOverlay frameSrc={FRAME_THIN} slice={16} bw={16} pad={6} bg="#951212">
                    <div className="text-center text-[12px] tracking-[3px] font-semibold">
                      {selectedMember?.name || ''}
                    </div>
                  </PixelFrameOverlay>
                </div>
              </div>
            </div>
          </PixelFrameOverlay>

          {/* Right box */}
          <PixelFrameOverlay frameSrc={FRAME_MAIN} slice={16} bw={16} pad={14} bg="#1B0C0C">
            <div className="text-[11px] leading-[1.6] opacity-90 whitespace-pre-line min-h-[180px]">
              {typedBio}
              {isTyping ? <span className="inline-block w-[8px] animate-pulse">▌</span> : null}
            </div>
          </PixelFrameOverlay>
        </div>
      </div>
    </div>
  )
}

function TeamItem({ isActive, isHover, imgSrc, onEnter, onLeave, onClick, frameSrc }) {
  const showFrame = isActive || isHover
  const bg = showFrame ? '#2A1616' : '#951212'

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer select-none"
    >
      {/* ✅ دايمًا نفس الـ wrapper (نفس المقاس) */}
      <PixelFrameOverlay
        frameSrc={'/frames/member-frame.png'}
        slice={13}
        bw={13}
        pad={8}
        bg="transparent"
        frameOpacity={showFrame ? 1 : 0} // ✅ البوردر بس اللي بيظهر/يختفي
        className="transition-opacity duration-150"
      >
        <div
          className="w-full h-[130px] md:h-[250px]  flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: bg }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt="Avatar"
              draggable={false}
              className="h-full w-auto"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="text-[10px] opacity-70">Avatar</div>
          )}
        </div>
      </PixelFrameOverlay>
    </div>
  )
}
