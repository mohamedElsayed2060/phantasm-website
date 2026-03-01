'use client'

import { Splide, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
import { imgUrl } from '@/lib/cms'

export default function ProjectMedia({ project }) {
  const single = project?.singleImage ? imgUrl(project.singleImage) : null
  const carousel = project?.carousel?.images || []
  const carouselImgs = Array.isArray(carousel)
    ? carousel.map((x) => imgUrl(x?.image || x)).filter(Boolean)
    : []

  const useCarousel = carouselImgs.length > 0

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
                <img
                  src={src}
                  alt={project?.projectName || 'Project'}
                  className="w-full max-h-[520px] object-contain drop-shadow-xl select-none"
                  draggable={false}
                />
              </SplideSlide>
            ))}
          </Splide>
        </div>
      ) : single ? (
        <img
          src={single}
          alt={project?.projectName || 'Project'}
          className="w-full max-w-[560px] max-h-[520px] object-contain drop-shadow-xl select-none"
          draggable={false}
        />
      ) : (
        <div className="text-black/50">No media</div>
      )}
    </div>
  )
}
