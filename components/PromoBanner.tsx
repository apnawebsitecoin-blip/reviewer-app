'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BannerSetting } from '@/lib/settings'

export default function PromoBanner({ banners }: { banners: BannerSetting[] }) {
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

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: `linear-gradient(120deg, ${b.bgFrom}, ${b.bgTo})`, transition: 'background 0.4s ease' }}
    >
      {/* Radial highlight overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 80% at 30% 50%, rgba(255,255,255,0.07), transparent)' }}
      />

      <div
        className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 md:py-16"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.18s ease' }}
      >
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          {/* Text */}
          <div className="flex-1 min-w-0">
            <span className="inline-block bg-white/15 border border-white/25 text-white text-xs font-bold px-3.5 py-1 rounded-full mb-4 backdrop-blur-sm">
              {b.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2.5 leading-tight tracking-tight">
              {b.title}
            </h2>
            <p className="text-white/70 text-sm sm:text-base mb-7 max-w-md leading-relaxed">
              {b.subtitle}
            </p>
            <Link
              href={b.href}
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3 rounded-lg text-sm shadow-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              {b.cta} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Emoji visual */}
          {b.emoji && (
            <div className="hidden sm:flex shrink-0 w-32 h-32 md:w-44 md:h-44 rounded-full items-center justify-center text-6xl md:text-8xl select-none bg-white/10">
              {b.emoji}
            </div>
          )}
        </div>

        {/* Slide controls */}
        {banners.length > 1 && (
          <div className="flex items-center gap-2.5 mt-8">
            <button onClick={prev} className="text-white/40 hover:text-white transition-colors" aria-label="Previous slide">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  background: `rgba(255,255,255,${i === current ? 1 : 0.35})`,
                  width: i === current ? '20px' : '8px',
                  height: '8px',
                }}
              />
            ))}
            <button onClick={next} className="text-white/40 hover:text-white transition-colors" aria-label="Next slide">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
