'use client'
import { Download } from 'lucide-react'

interface Props {
  stats: Record<string, string | number>
  topProducts: Array<{ name: string; review_count: number }>
}

export default function AnalyticsExport({ stats, topProducts }: Props) {
  const handleExport = () => {
    const today = new Date().toISOString().slice(0, 10)
    const rows: string[] = []

    rows.push('Analytics Export')
    rows.push(`Date,${today}`)
    rows.push('')
    rows.push('SUMMARY')
    rows.push('Label,Value')
    for (const [label, value] of Object.entries(stats)) {
      rows.push(`"${label}","${value}"`)
    }

    rows.push('')
    rows.push('TOP PRODUCTS BY REVIEWS')
    rows.push('Rank,Name,Review Count')
    topProducts.forEach((p, i) => {
      rows.push(`${i + 1},"${p.name}",${p.review_count}`)
    })

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  )
}
