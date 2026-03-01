'use client'

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import PixelFrameOverlay from '@/components/ui/PixelFrameOverlay'
import PixelScrollTrack from '@/components/island/Island-latest/overlays/components/PixelScrollTrack'
import PixelDivider from '@/components/island/Island-latest/overlays/components/PixelDivider'
import { imgUrl } from '@/lib/cms'
import { LexicalRich } from './renderLexicalRich'

function SectionHeading({ children }) {
  return (
    <div className="text-white text-[15px] tracking-[0.18em] uppercase mb-1 font-semibold">
      {children}
    </div>
  )
}

function SmallLabel({ children }) {
  return (
    <div className="text-white/80 text-[11px] tracking-[0.14em] uppercase mb-1">{children}</div>
  )
}

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-[3px] bg-black/25 text-white text-[10px] tracking-[0.14em] uppercase">
      {children}
    </span>
  )
}

function ActionButton({ href, disabled, children }) {
  const common =
    'w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 text-[11px] tracking-[0.16em] uppercase font-semibold rounded transition select-none'
  const cls = disabled
    ? `${common} bg-white/10 text-white/35 cursor-not-allowed`
    : `${common} bg-[#7a1010] hover:bg-[#8a1414] text-white cursor-pointer`

  if (disabled) return <div className={cls}>{children}</div>

  return (
    <a
      className={cls}
      href={href}
      target="_blank"
      rel="noreferrer"
      draggable={false}
      onClick={(e) => {
        if (!href) e.preventDefault()
      }}
    >
      {children}
    </a>
  )
}

function StoreBadge({ imgSrc, url, disabled, alt }) {
  const wrapCls = disabled ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer'
  return (
    <a
      href={disabled ? undefined : url || undefined}
      target={disabled ? undefined : '_blank'}
      rel={disabled ? undefined : 'noreferrer'}
      className={`inline-flex ${wrapCls}`}
      onClick={(e) => {
        if (disabled || !url) e.preventDefault()
      }}
      aria-disabled={disabled ? 'true' : 'false'}
    >
      {/* الصورة كزرار */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt || ''}
          className="h-[38px] sm:h-[42px] w-auto select-none rounded"
          draggable={false}
        />
      ) : null}
    </a>
  )
}

export default function ProjectDetailsScrollPanel({ project, maxHeight, maxHeightPx }) {
  const title = project?.projectName || ''
  const sub = project?.subTitle || ''
  const client = project?.client || ''
  const typeText = project?.type?.text || ''
  const achievement = project?.achievement || ''
  const comingSoon = Boolean(project?.comingSoon)

  const categoryTitle = typeof project?.category === 'object' ? project?.category?.title || '' : '' // لو جالك id بس مش object هتفضل فاضية

  const coverage = project?.coverage || null
  const desc = project?.descriptions || null
  const challenge = project?.challenge || null

  const typeIcon1 = project?.type?.icon?.icon1 ? imgUrl(project.type.icon.icon1) : null
  const typeIcon2 = project?.type?.icon?.icon2 ? imgUrl(project.type.icon.icon2) : null
  const typeIcon3 = project?.type?.icon?.icon3 ? imgUrl(project.type.icon.icon3) : null

  // technologies
  const technologies = Array.isArray(project?.technologies) ? project.technologies : []
  const techItems = useMemo(() => {
    return technologies
      .map((t) => {
        const src = t?.image ? imgUrl(t.image) : ''
        const name = String(t?.name || '').trim()
        if (!src && !name) return null
        return { src, name, semiLarge: Boolean(t?.semiLarge), id: t?.id || `${src}-${name}` }
      })
      .filter(Boolean)
  }, [technologies])

  // urls
  const url = String(project?.url || '').trim()
  const urlGroup = Array.isArray(project?.urlGroup) ? project.urlGroup : []
  const urlButtons = useMemo(() => {
    return urlGroup
      .map((x) => {
        const href = String(x?.url || '').trim()
        const text = String(x?.btnText || x?.name || '').trim()
        if (!href || !text) return null
        return { href, text }
      })
      .filter(Boolean)
  }, [urlGroup])

  // store urls
  const gpImg = project?.googlePlayUrl?.img ? imgUrl(project.googlePlayUrl.img) : ''
  const gpUrl = String(project?.googlePlayUrl?.url || '').trim()

  const asImg = project?.appStoreUrl?.img ? imgUrl(project.appStoreUrl.img) : ''
  const asUrl = String(project?.appStoreUrl?.url || '').trim()

  // scroll plumbing
  const scrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  })

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      setScrollState({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [project?.id])

  const needsScroll = scrollState.scrollHeight > scrollState.clientHeight + 1

  const handleScrollTo = (newScrollTop) => {
    if (scrollRef.current) scrollRef.current.scrollTop = newScrollTop
  }

  const heightStyle =
    typeof maxHeightPx === 'number'
      ? { height: `${maxHeightPx}px`, maxHeight: `${maxHeightPx}px` }
      : {}

  return (
    <PixelFrameOverlay
      frameSrc="/frames/CardFrame.png"
      slice={12}
      bw={12}
      pad={5}
      className="w-full overflow-hidden"
    >
      <PixelFrameOverlay
        frameSrc="/frames/dock-frame.png"
        slice={12}
        bw={12}
        pad={0}
        className="w-full overflow-hidden"
      >
        <div
          className="bg-[#2A1616] relative pt-[8px] flex flex-col overflow-hidden"
          style={heightStyle}
        >
          {/* Title */}
          <div className="mx-2 mt-[3px] shrink-0">
            <PixelFrameOverlay
              frameSrc="/frames/titleFrame.png"
              slice={4}
              bw={4}
              pad={0}
              bg="#951212"
              className="mb-2 w-full overflow-hidden"
              roundedClassName="rounded"
            >
              <div className="px-3 py-3 text-[13px] tracking-[0.22em] font-bold uppercase text-white">
                {title}
              </div>
            </PixelFrameOverlay>

            {/* ✅ Category under title */}
            {categoryTitle ? (
              <div className="mt-1 mb-2">
                <Pill>{categoryTitle}</Pill>
              </div>
            ) : null}
          </div>

          {/* Body */}
          <div className="flex items-start gap-[8px] px-2 pb-3 flex-1 min-h-0 overflow-hidden">
            {/* Scrollable column */}
            <div
              ref={scrollRef}
              className="min-w-0 flex-1 min-h-0 h-full px-2"
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
              }}
            >
              <style>{`.pd-right::-webkit-scrollbar{display:none}`}</style>

              <div className="pd-right overflow-hidden">
                {/* subtitle */}
                {sub ? (
                  <div className="text-white text-[12px] tracking-[0.18em] uppercase mb-3">
                    {sub}
                  </div>
                ) : null}

                <PixelDivider align="start" color="#5C3131" height={2} className="my-3" />

                {/* meta */}
                {client || typeText || achievement ? (
                  <div className="text-white text-[12px] tracking-[0.14em] uppercase space-y-2">
                    {client ? (
                      <div>
                        <span className="text-lg">CLIENT: </span> {client}
                      </div>
                    ) : null}

                    {typeText ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>
                          <span className="text-lg">TYPE:</span> {typeText}
                        </span>
                        {typeIcon1 ? (
                          <img src={typeIcon1} alt="" className=" w-4" draggable={false} />
                        ) : null}
                        {typeIcon2 ? (
                          <img src={typeIcon2} alt="" className=" w-4" draggable={false} />
                        ) : null}
                        {typeIcon3 ? (
                          <img src={typeIcon3} alt="" className="w-4" draggable={false} />
                        ) : null}
                      </div>
                    ) : null}

                    {achievement ? <div>ACHIEVEMENT: {achievement}</div> : null}
                  </div>
                ) : null}
                {/* ✅ Project Description */}
                {desc || true ? (
                  <div className="mt-5">
                    <SectionHeading>DESCRIPTION:</SectionHeading>
                    {desc ? (
                      <div className="text-white text-[12px] leading-[1.8] tracking-[0.12em] uppercase overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_iframe]:max-w-full">
                        <LexicalRich data={desc} />
                      </div>
                    ) : (
                      <div className="text-white/50 text-[12px]">—</div>
                    )}
                  </div>
                ) : null}

                {/* ✅ Challenge */}
                {challenge ? (
                  <div className="mt-5">
                    <PixelFrameOverlay
                      frameSrc="/frames/dock-frame.png"
                      slice={12}
                      bw={12}
                      pad={0}
                      className="w-full overflow-hidden"
                    >
                      <div className="bg-[#5C3131] p-4">
                        <SectionHeading>CHALLENGE</SectionHeading>
                        <div className="text-white text-[12px] leading-[1.8] tracking-[0.12em] uppercase overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_iframe]:max-w-full">
                          <LexicalRich data={challenge} />
                        </div>
                      </div>
                    </PixelFrameOverlay>
                  </div>
                ) : null}

                {/* ✅ Coverage */}
                {coverage ? (
                  <div className="mt-5">
                    <SectionHeading>COVERAGE:</SectionHeading>

                    <div className="text-white text-[11px] leading-[1.7] tracking-[0.12em] uppercase overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_iframe]:max-w-full">
                      <LexicalRich data={coverage} />
                    </div>
                  </div>
                ) : null}
                {/* ✅ Technologies */}
                {techItems.length ? (
                  <div className="mt-5">
                    <SectionHeading>TECHNOLOGIES</SectionHeading>

                    <div className="flex flex-wrap gap-3">
                      {techItems.map((t) => (
                        <div
                          key={t.id}
                          className="w-[66px] sm:w-[74px] flex flex-col items-center text-center"
                        >
                          {t.src ? (
                            <div className="w-full flex justify-center">
                              <img
                                src={t.src}
                                alt={t.name || ''}
                                draggable={false}
                                className={`select-none object-contain ${
                                  t.semiLarge ? 'h-[34px] sm:h-[40px]' : 'h-[30px] sm:h-[36px]'
                                } w-auto`}
                              />
                            </div>
                          ) : (
                            <div className="h-[30px]" />
                          )}

                          {t.name ? (
                            <div className="mt-1 text-white/85 text-[10px] tracking-[0.12em] uppercase leading-tight">
                              {t.name}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ✅ Website buttons */}
                {url || urlButtons.length ? (
                  <div className="mt-5">
                    <SectionHeading>LINKS</SectionHeading>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      {/* لو url الواحد راجع */}
                      {url ? <ActionButton href={url}>VISIT WEBSITE</ActionButton> : null}

                      {/* لو urlGroup راجع */}
                      {urlButtons.map((b, idx) => (
                        <ActionButton key={`${b.href}-${idx}`} href={b.href}>
                          {b.text}
                        </ActionButton>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* ✅ Stores */}
                {gpImg || asImg || gpUrl || asUrl ? (
                  <div className="mt-5 mb-2">
                    <div className="flex items-center justify-between gap-3">
                      <SectionHeading>STORES</SectionHeading>
                      {comingSoon ? (
                        <div className="text-white/70 text-[10px] tracking-[0.18em] uppercase">
                          COMING SOON
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {gpImg ? (
                        <StoreBadge
                          imgSrc={gpImg}
                          url={gpUrl}
                          disabled={comingSoon || !gpUrl}
                          alt="Google Play"
                        />
                      ) : null}

                      {asImg ? (
                        <StoreBadge
                          imgSrc={asImg}
                          url={asUrl}
                          disabled={comingSoon || !asUrl}
                          alt="App Store"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* pixel track */}
            {needsScroll ? (
              <PixelScrollTrack
                scrollTop={scrollState.scrollTop}
                scrollHeight={scrollState.scrollHeight}
                clientHeight={scrollState.clientHeight}
                trackHeight={scrollState.clientHeight}
                onScrollTo={handleScrollTo}
              />
            ) : null}
          </div>
        </div>
      </PixelFrameOverlay>
    </PixelFrameOverlay>
  )
}
