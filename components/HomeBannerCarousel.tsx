'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface HomeBanner {
  id: string
  image_url: string | null
  title: string
  subtitle: string | null
  link_url: string | null
  display_order: number
  platform: string | null
}

export default function HomeBannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  const goTo = useCallback((idx: number) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 180)
  }, [])

  const next = useCallback(() => goTo((current + 1) % banners.length), [current, goTo, banners.length])
  const prev = () => goTo((current - 1 + banners.length) % banners.length)

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [next, banners.length])

  if (!banners.length) return null

  const b = banners[Math.min(current, banners.length - 1)]

  const slide = (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.18s ease',
        paddingBottom: '33%',
        minHeight: '140px',
      }}
    >
      <div className="absolute inset-0 bg-gray-200">
        {b.image_url && (
          <Image
            src={b.image_url}
            alt={b.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            priority={current === 0}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent pointer-events-none rounded-xl" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
        {b.platform && (
          <span className="inline-block bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 w-fit backdrop-blur-sm border border-white/25">
            {b.platform}
          </span>
        )}
        <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-1 drop-shadow max-w-xs sm:max-w-sm">
          {b.title}
        </h2>
        {b.subtitle && (
          <p className="text-white/80 text-xs sm:text-sm max-w-xs leading-relaxed drop-shadow hidden sm:block">
            {b.subtitle}
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative w-full">
      {b.link_url ? <Link href={b.link_url}>{slide}</Link> : slide}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  background: `rgba(255,255,255,${i === current ? 1 : 0.45})`,
                  width: i === current ? '20px' : '8px',
                  height: '8px',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
