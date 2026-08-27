'use client'
import { motion } from 'framer-motion'

export default function AnimatedProgressBar({
  progress,
  barClass,
}: {
  progress: number
  barClass: string
}) {
  return (
    <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-2">
      <motion.div
        className={`h-full ${barClass} rounded-full`}
        initial={{ width: 0 }}
        whileInView={{ width: `${progress}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
      />
    </div>
  )
}
