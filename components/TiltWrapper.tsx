'use client'
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function TiltWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const rotateX = useSpring(useTransform(rawY, [-1, 1], [7, -7]), { stiffness: 300, damping: 28 })
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-7, 7]), { stiffness: 300, damping: 28 })
  const scale   = useSpring(1, { stiffness: 300, damping: 28 })
  const glareX  = useTransform(rawX, [-1, 1], [0, 100])
  const glareY  = useTransform(rawY, [-1, 1], [0, 100])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    rawX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    rawY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
    scale.set(1.03)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
    scale.set(1)
  }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, scale, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
      {/* Glare overlay */}
      <motion.div
        style={{
          background: useTransform(
            [glareX, glareY],
            ([x, y]) =>
              `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.18) 0%, transparent 60%)`
          ),
        }}
        className="absolute inset-0 rounded-xl pointer-events-none z-10"
      />
    </motion.div>
  )
}
