'use client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  positive: number
  neutral: number
  negative: number
}

const COLORS = ['#22c55e', '#eab308', '#ef4444']

export default function SentimentChart({ positive, neutral, negative }: Props) {
  const total = positive + neutral + negative
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">अभी कोई रिव्यू नहीं</div>
  )

  const data = [
    { name: 'सकारात्मक', value: positive },
    { name: 'तटस्थ', value: neutral },
    { name: 'नकारात्मक', value: negative },
  ].filter(d => d.value > 0)

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[['सकारात्मक','तटस्थ','नकारात्मक'].indexOf(entry.name)]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => [`${Math.round((Number(val) / total) * 100)}% (${val})`, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
