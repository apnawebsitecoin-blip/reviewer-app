import Link from 'next/link'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div className="max-w-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <WifiOff className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">You&apos;re Offline</h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Internet connection nahi hai. Please check your connection aur try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
