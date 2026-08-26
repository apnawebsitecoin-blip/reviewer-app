import { Film } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { VideoReview } from '@/lib/types'

export default function VideoReviewsSection({ videos }: { videos: VideoReview[] }) {
  if (!videos.length) return null

  return (
    <div>
      <h2 className="font-bold text-gray-800 mb-4 text-lg flex items-center gap-2">
        <Film className="w-5 h-5 text-red-500" />
        Video Reviews ({videos.length})
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map(v => (
          <div key={v.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
            {/* YouTube embed */}
            <div className="aspect-video bg-gray-100">
              <iframe
                src={`https://www.youtube.com/embed/${v.youtube_video_id}?rel=0&modestbranding=1`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
              />
            </div>
            {/* Meta */}
            <div className="p-3 bg-white">
              <p className="text-sm font-semibold text-gray-900 line-clamp-1">{v.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  by {(v.profiles as any)?.name ?? 'Reviewer'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(v.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
