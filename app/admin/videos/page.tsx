'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Film, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { VideoReview } from '@/lib/types'

export default function AdminVideosPage() {
  const supabase = createClient()
  const [videos,   setVideos]   = useState<VideoReview[]>([])
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('video_reviews')
      .select('*, profiles(name), products(name)')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVideos((data as VideoReview[]) ?? [])
        setLoading(false)
      })
  }, [])

  const handleDelete = async (video: VideoReview) => {
    if (!confirm(`"${video.title}" ko YouTube se bhi delete karein?`)) return
    setDeleting(video.id)
    try {
      await fetch(`/api/admin/videos/${video.id}`, { method: 'DELETE' })
      setVideos(prev => prev.filter(v => v.id !== video.id))
    } catch {
      alert('Delete fail hua — dobara try karo')
    }
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Video Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Reviewers dwara upload ki gayi YouTube videos manage karo</p>
        </div>
        <span className="bg-red-50 text-red-600 border border-red-100 text-sm font-bold px-3 py-1 rounded-full">
          {videos.length} videos
        </span>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <Film className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Abhi koi video review nahi</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Video</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reviewer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {videos.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Thumbnail + title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://youtube.com/watch?v=${v.youtube_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 relative block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://img.youtube.com/vi/${v.youtube_video_id}/mqdefault.jpg`}
                            alt={v.title}
                            className="w-24 h-14 object-cover rounded-lg bg-gray-100"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black/60 rounded-full p-1.5">
                              <ExternalLink className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </a>
                        <p className="font-semibold text-gray-900 line-clamp-2 max-w-[180px] text-xs leading-snug">
                          {v.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 font-medium">
                        {(v.products as any)?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {(v.profiles as any)?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(v.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === 'live'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : v.status === 'processing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(v)}
                        disabled={deleting === v.id}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="YouTube se bhi delete karo"
                      >
                        {deleting === v.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
