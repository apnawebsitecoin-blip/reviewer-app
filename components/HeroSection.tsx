'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Search, Star, Wallet, IndianRupee, BadgeCheck, Zap } from 'lucide-react'

// ── Marquee ticker ────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  '⭐  4,200+ verified reviewers earning today',
  '💸  ₹2,40,000+ cashback diya gaya abhi tak',
  '🛡️  Verified purchase proof required — no fake reviews',
  '🔥  Live: 38 reviews abhi likhe ja rahe hain',
  '✅  Har review manually verified by our team',
  '🚀  Join 4,200+ reviewers — free registration',
  '💰  Average ₹850 / month earned per reviewer',
]

function MarqueeTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="w-full overflow-hidden bg-indigo-600 py-2.5">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center text-white text-xs font-semibold px-8 shrink-0">
            {item}
            <span className="mx-6 opacity-40">|</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Story animation ───────────────────────────────────────────────────────────

const REVIEW_TEXT = "Bilkul sahi product! Quality top-class hai, delivery bhi super fast thi. Highly recommended! 🙌"
const PHASES = ['product', 'typing', 'stars', 'money'] as const
type Phase = typeof PHASES[number]

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function StoryCard() {
  const [phase, setPhase] = useState<Phase>('product')
  const [typedCount, setTypedCount] = useState(0)
  const [starsShown, setStarsShown] = useState(0)
  const [coinFly, setCoinFly] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false

    const run = async () => {
      while (!cancelRef.current) {
        // Phase 1: product
        setPhase('product')
        setTypedCount(0)
        setStarsShown(0)
        setCoinFly(false)
        await sleep(1400)
        if (cancelRef.current) break

        // Phase 2: typing
        setPhase('typing')
        for (let i = 1; i <= REVIEW_TEXT.length; i++) {
          if (cancelRef.current) break
          setTypedCount(i)
          await sleep(36)
        }
        await sleep(400)
        if (cancelRef.current) break

        // Phase 3: stars
        setPhase('stars')
        for (let s = 1; s <= 5; s++) {
          if (cancelRef.current) break
          setStarsShown(s)
          await sleep(200)
        }
        await sleep(700)
        if (cancelRef.current) break

        // Phase 4: money
        setPhase('money')
        setCoinFly(true)
        await sleep(2200)
        if (cancelRef.current) break

        // pause before loop
        await sleep(800)
      }
    }

    run()
    return () => { cancelRef.current = true }
  }, [])

  return (
    <div className="relative w-72 sm:w-80 mx-auto">
      {/* Phone mockup card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Status bar */}
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
          <span className="text-white/60 text-[10px] font-mono">9:41</span>
          <div className="flex gap-1">
            <div className="w-3 h-1.5 bg-white/40 rounded-full" />
            <div className="w-3 h-1.5 bg-white/40 rounded-full" />
            <div className="w-4 h-1.5 bg-white/70 rounded-full" />
          </div>
        </div>

        {/* App header */}
        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-white/80" />
          <span className="text-white text-xs font-bold tracking-wide">ReviewApp — Write & Earn</span>
        </div>

        {/* Content area */}
        <div className="p-4 min-h-[200px]">
          <AnimatePresence mode="wait">

            {/* Phase 1: Product card */}
            {phase === 'product' && (
              <motion.div
                key="product"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Review this product</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-snug">iPhone 15 Pro</p>
                    <p className="text-xs text-gray-400 mt-0.5">Amazon · ₹89,999</p>
                    <span className="inline-block mt-1 bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      Earn ₹50 cashback
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="mt-3 flex items-center gap-1.5 text-indigo-500"
                >
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  <span className="text-[10px] font-semibold">Tap to write your review…</span>
                </motion.div>
              </motion.div>
            )}

            {/* Phase 2: Typing */}
            {phase === 'typing' && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Your Review</p>
                <div className="bg-gray-50 rounded-xl p-3 border border-indigo-200 min-h-[90px]">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {REVIEW_TEXT.slice(0, typedCount)}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="inline-block w-0.5 h-3 bg-indigo-500 ml-0.5 align-middle"
                    />
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 text-right">{typedCount} characters</p>
              </motion.div>
            )}

            {/* Phase 3: Stars */}
            {phase === 'stars' && (
              <motion.div
                key="stars"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">Rate this product</p>
                <div className="flex gap-2 justify-center my-4">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.div
                      key={n}
                      initial={{ scale: 0, rotate: -20 }}
                      animate={starsShown >= n ? { scale: 1, rotate: 0 } : { scale: 0.3, rotate: -20 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Star
                        className="w-8 h-8"
                        fill={starsShown >= n ? '#f59e0b' : 'none'}
                        stroke={starsShown >= n ? '#f59e0b' : '#d1d5db'}
                        strokeWidth={1.5}
                      />
                    </motion.div>
                  ))}
                </div>
                {starsShown === 5 && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs font-bold text-amber-500"
                  >
                    Excellent! ⭐⭐⭐⭐⭐
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Phase 4: Money */}
            {phase === 'money' && (
              <motion.div
                key="money"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-4 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                  className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <BadgeCheck className="w-8 h-8 text-green-500" />
                </motion.div>

                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">Review Verified! 🎉</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cashback credited to wallet</p>
                </div>

                {/* Flying coin */}
                <motion.div
                  initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                  animate={coinFly ? {
                    y: [-4, -24, -8],
                    opacity: [1, 1, 0],
                    scale: [1, 1.3, 0.8],
                  } : {}}
                  transition={{ duration: 0.9, ease: 'easeInOut' }}
                  className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span className="text-sm font-black">+₹50 credited!</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100"
                >
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs text-gray-700">Wallet: <span className="font-bold text-gray-900">₹1,250</span></span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: 2, duration: 0.4, delay: 0.9 }}
                    className="text-xs text-green-500 font-bold"
                  >+50</motion.span>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Bottom bar */}
        <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">reviewapp.in</span>
          <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Floating badges ───────────────────────────────────────────────────────────

function FloatingBadges() {
  return (
    <div className="relative w-72 sm:w-80 mx-auto h-0">
      {/* Badge: Live reviewers */}
      <div
        className="animate-float absolute -top-4 -left-8 sm:-left-14 z-10
          bg-white border border-gray-100 shadow-lg rounded-2xl px-3 py-2
          flex items-center gap-2 whitespace-nowrap"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
        <span className="text-xs font-bold text-gray-700">Live: 38 reviews writing</span>
      </div>

      {/* Badge: Verified */}
      <div
        className="animate-float2 absolute -top-4 -right-8 sm:-right-14 z-10
          bg-white border border-indigo-100 shadow-lg rounded-2xl px-3 py-2
          flex items-center gap-1.5 whitespace-nowrap"
      >
        <BadgeCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-xs font-bold text-indigo-600">Verified Platform</span>
      </div>

      {/* Badge: Cashback */}
      <div
        className="animate-float3 absolute -bottom-56 sm:-bottom-60 -right-6 sm:-right-12 z-10
          bg-amber-500 shadow-lg rounded-2xl px-3 py-2
          flex items-center gap-1.5 whitespace-nowrap"
      >
        <Zap className="w-3 h-3 text-white shrink-0" />
        <span className="text-[11px] font-bold text-white">₹2.4L+ cashback given</span>
      </div>
    </div>
  )
}

// ── Main HeroSection ──────────────────────────────────────────────────────────

const STEPS = [
  { icon: Search,      label: 'Browse',  desc: 'Best deals dhundo',    color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  num: '01' },
  { icon: Star,        label: 'Review',  desc: 'Honest review likho',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  num: '02' },
  { icon: IndianRupee, label: 'Earn',    desc: 'Commission wallet mein',color: '#10b981', bg: 'rgba(16,185,129,0.1)', num: '03' },
]

export default function HeroSection({ brand }: { brand: string }) {
  return (
    <>
      {/* ── Marquee ticker ── */}
      <div className="-mx-4 sm:-mx-6 mb-10">
        <MarqueeTicker />
      </div>

      {/* ── Hero body ── */}
      <section className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 pb-16 mb-10 overflow-visible">
        {/* Ambient gradient blobs */}
        <div
          className="absolute -top-24 right-0 w-96 h-96 rounded-full opacity-[0.07] blur-3xl pointer-events-none"
          style={{ background: brand }}
        />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-[0.06] blur-3xl pointer-events-none bg-amber-400" />

        <div className="relative max-w-6xl mx-auto">

          {/* Two-column layout: text left, animation right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* ── LEFT: Typography + CTA ── */}
            <div className="text-center lg:text-left">

              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6"
              >
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                India ka #1 Verified Review Platform
              </motion.div>

              {/* Main heading — typography-driven, no box */}
              <div className="mb-6">
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-gray-900"
                >
                  Likho
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight"
                  style={{ color: brand }}
                >
                  honest review,
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-gray-900"
                >
                  kamao asli
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-gray-900"
                >
                  paisa.
                </motion.h1>
              </div>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.48 }}
                className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-md mx-auto lg:mx-0"
              >
                Har verified review par cashback milta hai. Real buyers, real reviews — fake ka koi jagah nahi.
              </motion.p>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.56 }}
                className="flex items-center gap-6 mb-8 justify-center lg:justify-start"
              >
                {[
                  { val: '4,200+', label: 'Reviewers' },
                  { val: '₹2.4L+', label: 'Cashback' },
                  { val: '99%', label: 'Verified' },
                ].map(s => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="text-xl font-black text-gray-900">{s.val}</p>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.64 }}
                className="flex items-center gap-3 justify-center lg:justify-start"
              >
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 text-white text-sm font-bold px-7 py-3.5 rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)`, boxShadow: `0 8px 28px ${brand}40` }}
                >
                  Abhi Join Karo — Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold px-6 py-3.5 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                >
                  Deals Dekho
                </Link>
              </motion.div>
            </div>

            {/* ── RIGHT: Story animation + floating badges ── */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center"
            >
              <FloatingBadges />
              <StoryCard />
            </motion.div>
          </div>

          {/* ── 3-step visual ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-16 pt-10 border-t border-gray-100"
          >
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
              Kaise kaam karta hai?
            </p>
            <div className="flex items-center justify-center gap-0">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center w-28 sm:w-36">
                    <div
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md"
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
                  </div>
                  {i < STEPS.length - 1 && (
                    <svg width="32" height="16" viewBox="0 0 32 16" className="mx-1 sm:mx-3 shrink-0" fill="none">
                      <path d="M0 8 H26 M22 4 L30 8 L22 12" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>
    </>
  )
}
