'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, PenLine, Wallet, User } from 'lucide-react'

// Layout constants (px, fixed-width container)
const W = 284          // container width
const ICON = 38        // checkpoint icon size
const PERSON = 22      // person circle size
const TRACK_Y = 82     // track center-y from container top
// Checkpoint center-x positions
const CX = [ICON / 2 + 4, W / 2, W - ICON / 2 - 4] // 23, 142, 261

const CHECKPOINTS = [
  { id: 'buy',    Icon: ShoppingCart, label: 'Order Kiya!',   color: '#4F46E5', bg: '#EEF2FF', ring: '#A5B4FC', coins: null },
  { id: 'review', Icon: PenLine,      label: 'Review Likha!', color: '#D97706', bg: '#FFFBEB', ring: '#FCD34D', coins: null },
  { id: 'earn',   Icon: Wallet,       label: '₹ Mila!',       color: '#059669', bg: '#ECFDF5', ring: '#6EE7B7', coins: ['₹50', '₹25', '₹75'] },
] as const

type Phase = 'at_0' | 'walk_1' | 'at_1' | 'walk_2' | 'at_2' | 'fade'

const SEQUENCE: { phase: Phase; dur: number }[] = [
  { phase: 'at_0',   dur: 2600 },
  { phase: 'walk_1', dur: 1300 },
  { phase: 'at_1',   dur: 2600 },
  { phase: 'walk_2', dur: 1300 },
  { phase: 'at_2',   dur: 2600 },
  { phase: 'fade',   dur: 700  },
]

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

export default function EarningStoryAnimation() {
  const [phase, setPhase] = useState<Phase>('at_0')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      while (!cancelled) {
        for (const { phase: p, dur } of SEQUENCE) {
          if (cancelled) return
          setPhase(p)
          await sleep(dur)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  const isWalking   = phase === 'walk_1' || phase === 'walk_2'
  const isFading    = phase === 'fade'
  const activeIdx   = phase === 'at_0' ? 0 : phase === 'at_1' ? 1 : phase === 'at_2' ? 2 : null

  // Person target x (translateX, centered on checkpoint)
  const personX =
    phase === 'at_0'               ? CX[0] - PERSON / 2
    : phase === 'walk_1' || phase === 'at_1' ? CX[1] - PERSON / 2
    : CX[2] - PERSON / 2   // walk_2, at_2, fade → stay at checkpoint 3

  const xDuration = phase === 'at_0' ? 0.01 : isWalking ? 1.3 : 0.05

  // Label alignment per checkpoint edge
  const labelAlign = (i: number) =>
    i === 0 ? { left: 0 }
    : i === 2 ? { right: 0 }
    : { left: '50%', transform: 'translateX(-50%)' }

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* ── Journey track ── */}
      <div className="relative" style={{ width: W, height: TRACK_Y + ICON / 2 + 8 }}>

        {/* Track line */}
        <div
          className="absolute bg-gray-200 rounded-full"
          style={{ left: CX[0], right: W - CX[2], top: TRACK_Y - 1, height: 2 }}
        />

        {/* Progress fill up to current active checkpoint */}
        <motion.div
          className="absolute rounded-full"
          style={{ left: CX[0], top: TRACK_Y - 1, height: 2, background: '#6366F1' }}
          animate={{ width: activeIdx === null ? 0 : CX[activeIdx] - CX[0] }}
          transition={{ duration: isWalking ? 1.3 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Checkpoint icons */}
        {CHECKPOINTS.map((cp, i) => {
          const isActive = activeIdx === i
          return (
            <motion.div
              key={cp.id}
              className="absolute flex items-center justify-center rounded-2xl"
              style={{
                left: CX[i] - ICON / 2,
                top: TRACK_Y - ICON / 2,
                width: ICON,
                height: ICON,
                background: cp.bg,
                border: `2px solid ${isActive ? cp.ring : cp.ring + '55'}`,
              }}
              animate={{
                scale: isActive ? 1.18 : 1,
                boxShadow: isActive ? `0 0 14px ${cp.color}45` : '0 1px 3px rgba(0,0,0,0.06)',
              }}
              transition={{ duration: 0.3 }}
            >
              <cp.Icon
                strokeWidth={1.8}
                style={{ color: cp.color, width: ICON * 0.5, height: ICON * 0.5 }}
              />
            </motion.div>
          )
        })}

        {/* Labels above (appear when person is at that checkpoint) */}
        {CHECKPOINTS.map((cp, i) => (
          <AnimatePresence key={cp.id}>
            {activeIdx === i && (
              <motion.div
                className="absolute"
                style={{ top: 4, ...labelAlign(i) }}
                initial={{ opacity: 0, y: 8, scale: 0.82 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="text-[11px] font-black px-2.5 py-0.5 rounded-full text-white shadow-sm whitespace-nowrap"
                    style={{ background: cp.color }}
                  >
                    {cp.label}
                  </span>

                  {/* Coins burst — earn step only */}
                  {cp.coins && (
                    <div className="flex gap-1">
                      {cp.coins.map((coin, ci) => (
                        <motion.span
                          key={coin}
                          className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.28 + ci * 0.12, type: 'spring', stiffness: 380 }}
                        >
                          +{coin}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Walking person */}
        <motion.div
          className="absolute"
          style={{ top: TRACK_Y - PERSON / 2 }}
          initial={{ x: CX[0] - PERSON / 2 }}
          animate={{
            x: personX,
            opacity: isFading ? 0 : 1,
          }}
          transition={{
            x: { duration: xDuration, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: isFading ? 0.45 : 0.2 },
          }}
        >
          {/* Bob up-down when walking */}
          <motion.div
            animate={isWalking ? { y: [0, -4, 0, -4, 0] } : { y: 0 }}
            transition={
              isWalking
                ? { repeat: Infinity, duration: 0.32, ease: 'easeInOut' }
                : { duration: 0.18 }
            }
          >
            <div
              className="rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
              style={{ width: PERSON, height: PERSON, background: '#4F46E5' }}
            >
              <User
                strokeWidth={2.2}
                className="text-white"
                style={{ width: PERSON * 0.55, height: PERSON * 0.55 }}
              />
            </div>
          </motion.div>
        </motion.div>

      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Journey steps">
        {CHECKPOINTS.map((cp, i) => (
          <motion.div
            key={cp.id}
            className="h-2 rounded-full"
            animate={{
              width: activeIdx === i ? 22 : 8,
              backgroundColor: activeIdx === i ? cp.color : '#E0E7FF',
              opacity: activeIdx === i ? 1 : 0.5,
            }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
    </div>
  )
}
