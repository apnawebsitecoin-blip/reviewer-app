'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Star, IndianRupee, ArrowRight } from 'lucide-react'

const HEADLINE = ['Review', 'likho,', 'paisa', 'kamao']

const STEPS = [
  {
    icon: Search,
    label: 'Browse',
    desc: 'Best deals dhundo',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    num: '01',
  },
  {
    icon: Star,
    label: 'Review',
    desc: 'Honest review likho',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    num: '02',
  },
  {
    icon: IndianRupee,
    label: 'Earn',
    desc: 'Commission wallet mein',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    num: '03',
  },
]

export default function HeroSection({ brand }: { brand: string }) {
  return (
    <section className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 pt-10 pb-12 mb-10 overflow-hidden">
      {/* Background gradient blobs */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: brand }}
      />
      <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none bg-amber-400" />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-5"
        >
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          Verified Reviewers Community
        </motion.div>

        {/* Animated headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-5 tracking-tight">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block mr-3"
              style={i >= 2 ? { color: brand } : undefined}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-8"
        >
          Har verified review par cashback aur commission milta hai. Real buyers, real reviews, real earnings.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.65 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)`, boxShadow: `0 8px 24px ${brand}40` }}
          >
            Abhi Join Karo <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-6 py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            Deals Dekho
          </Link>
        </motion.div>

        {/* 3-step visual */}
        <div className="relative flex items-center justify-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.75 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center w-28 sm:w-32"
              >
                {/* Step card */}
                <div
                  className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                  style={{ background: step.bg, border: `1.5px solid ${step.color}22` }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  <span
                    className="absolute -top-2 -right-2 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
                    style={{ background: step.color }}
                  >
                    {step.num}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800">{step.label}</p>
                <p className="text-[11px] text-gray-400 text-center leading-snug mt-0.5">{step.desc}</p>
              </motion.div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.35, delay: 0.9 + i * 0.15, ease: 'easeOut' }}
                  className="origin-left"
                >
                  <svg width="32" height="16" viewBox="0 0 32 16" className="mx-1 sm:mx-2" fill="none">
                    <path d="M0 8 H26 M22 4 L30 8 L22 12" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
