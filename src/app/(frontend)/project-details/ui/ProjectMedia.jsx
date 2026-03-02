'use client'

import { useEffect } from 'react'
import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
import { imgUrl } from '@/lib/cms'
import PremiumImage from '@/components/ui/PremiumImage'

export default function ProjectMedia({ project }) {
  const single = project?.singleImage ? imgUrl(project.singleImage) : null
  const carousel = project?.carousel?.images || []
  const carouselImgs = Array.isArray(carousel)
    ? carousel.map((x) => imgUrl(x?.image || x)).filter(Boolean)
    : []

  const useCarousel = carouselImgs.length > 0

  // ✅ preload first media for instant first paint
  useEffect(() => {
    const first = useCarousel ? carouselImgs[0] : single
    if (!first) return
    const img = new Image()
    img.src = first
    img.decode?.().catch(() => {})
  }, [useCarousel, carouselImgs, single])

  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      {useCarousel ? (
        <div className="w-full max-w-[560px] px-6">
          <Splide
            options={{
              type: 'loop',
              perPage: 1,
              gap: '8px',
              arrows: true,
              pagination: false,
              drag: true,
            }}
          >
            {carouselImgs.map((src, idx) => (
              <SplideSlide key={idx}>
                <PremiumImage
                  src={src}
                  alt={project?.projectName || 'Project'}
                  ratio="16/10"
                  contain
                  priority={idx === 0}
                  className="drop-shadow-xl"
                />
              </SplideSlide>
            ))}
          </Splide>
        </div>
      ) : single ? (
        <div className="w-full max-w-[560px] px-6">
          <PremiumImage
            src={single}
            alt={project?.projectName || 'Project'}
            ratio="16/10"
            maxH={520}
            contain
            priority
            className="drop-shadow-xl"
          />
        </div>
      ) : (
        <div className="text-black/50">No media</div>
      )}
    </div>
  )
}
