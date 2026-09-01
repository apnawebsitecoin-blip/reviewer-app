'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  productName: string
}

export default function ProductImageGallery({ images, productName }: Props) {
  const [current, setCurrent] = useState(0)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-7xl text-gray-200">📦</div>
    )
  }

  if (images.length === 1) {
    return (
      <Image
        src={images[0]}
        alt={productName}
        fill
        className="object-cover"
        unoptimized
        priority
      />
    )
  }

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)
  const next = () => setCurrent(c => (c + 1) % images.length)

  return (
    <div
      className="relative w-full h-full group"
      onPointerDown={e => {
        dragStart.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={e => {
        if (!dragStart.current) return
        const dx = e.clientX - dragStart.current.x
        const dy = Math.abs(e.clientY - dragStart.current.y)
        dragStart.current = null
        if (Math.abs(dx) > 40 && dy < 60) {
          if (dx < 0) next(); else prev()
        }
      }}
      onPointerLeave={() => { dragStart.current = null }}
    >
      {/* Image with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Image
            src={images[current]}
            alt={`${productName} — image ${current + 1}`}
            fill
            className="object-cover"
            unoptimized
            priority={current === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Arrow buttons — visible on hover (desktop), always present for a11y */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4 text-gray-700" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </button>

      {/* Counter pill */}
      <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
        {current + 1}/{images.length}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Image ${i + 1}`}
            className="rounded-full transition-all duration-200 shrink-0"
            style={{
              width: i === current ? 16 : 6,
              height: 6,
              background: i === current ? 'white' : 'rgba(255,255,255,0.55)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
