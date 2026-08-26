'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTranslations } from 'next-intl'

interface Props {
  positive: number
  neutral: number
  negative: number
}

export default function SentimentChart({ positive, neutral, negative }: Props) {
  const t = useTranslations('review')
  const tp = useTranslations('product')
  const total = positive + neutral + negative
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">{tp('noReviewsChart')}</div>
  )

  const data = [
    { name: t('positiveLabel'), value: positive, color: '#22c55e' },
    { name: t('neutralLabel'),  value: neutral,  color: '#eab308' },
    { name: t('negativeLabel'), value: negative, color: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map(entry => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => [`${Math.round((Number(val) / total) * 100)}% (${val})`, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
