'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, PenLine, Wallet } from 'lucide-react'

const STEPS = [
  {
    id: 'buy',
    Icon: ShoppingCart,
    label: 'Kharida!',
    sub: 'Product verified purchase ✓',
    iconColor: '#4F46E5',
    bg: '#EEF2FF',
    ring: '#C7D2FE',
    badge: null,
  },
  {
    id: 'review',
    Icon: PenLine,
    label: 'Review Likha!',
    sub: 'Honest feedback submit ✓',
    iconColor: '#D97706',
    bg: '#FFFBEB',
    ring: '#FDE68A',
    badge: null,
  },
  {
    id: 'earn',
    Icon: Wallet,
    label: '₹ Mila!',
    sub: 'Cashback wallet mein ✓',
    iconColor: '#059669',
    bg: '#ECFDF5',
    ring: '#6EE7B7',
    badge: ['₹50', '₹25', '₹75'],
  },
] as const

const DURATION = 2400 // ms per step

export default function EarningStoryAnimation() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), DURATION)
    return () => clearInterval(t)
  }, [])

  const s = STEPS[step]

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Step card */}
      <div className="relative w-[220px] h-[168px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.72, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -14 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-3 w-full"
          >
            {/* Icon */}
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: s.bg, border: `2px solid ${s.ring}` }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <s.Icon
                className="w-8 h-8"
                style={{ color: s.iconColor }}
                strokeWidth={1.6}
              />
            </motion.div>

            {/* Label */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <p className="text-base font-black text-gray-900 leading-tight">{s.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{s.sub}</p>
            </motion.div>

            {/* Bouncing coins — only on earn step */}
            {s.badge && (
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.28, type: 'spring', stiffness: 420, damping: 18 }}
              >
                {s.badge.map((coin, i) => (
                  <motion.span
                    key={coin}
                    className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.1,
                      delay: i * 0.18,
                      ease: 'easeInOut',
                    }}
                  >
                    +{coin}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Animation steps">
        {STEPS.map((st, i) => (
          <motion.button
            key={st.id}
            role="tab"
            aria-selected={i === step}
            aria-label={st.label}
            onClick={() => setStep(i)}
            className="rounded-full cursor-pointer"
            animate={{
              width: i === step ? 22 : 8,
              backgroundColor: i === step ? '#4F46E5' : '#E0E7FF',
              opacity: i === step ? 1 : 0.6,
            }}
            style={{ height: 8 }}
            transition={{ duration: 0.28 }}
          />
        ))}
      </div>
    </div>
  )
}
