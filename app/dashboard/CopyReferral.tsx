'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyReferral({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <code className="text-sm bg-white border rounded-lg px-3 py-1.5 flex-1 overflow-auto font-mono text-indigo-700">{code}</code>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 flex items-center gap-1 min-w-[60px] justify-center">
        {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
      </button>
    </div>
  )
}
