'use client'
import { motion } from 'framer-motion'
import CountUp from '@/components/CountUp'

interface Props {
  icon: React.ReactNode
  label: string
  value: number
  prefix?: string
  suffix?: string
}

export default function DashboardStatCard({ icon, label, value, prefix = '', suffix = '' }: Props) {
  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 cursor-default"
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-black text-gray-800">
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </p>
    </motion.div>
  )
}
