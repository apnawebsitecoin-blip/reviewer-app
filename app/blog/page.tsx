import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/settings'
import type { Metadata } from 'next'
import { BookOpen, Calendar, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: `Blog & Guides — ${settings.siteName}`,
    description: `Product guides, buying advice, and deal tips from ${settings.siteName}.`,
  }
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image, category, meta_description, published_at')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  const list = posts ?? []

  return (
    <div className="max-w-5xl mx-auto py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest mb-2">
          <BookOpen className="w-4 h-4" /> Guides & Blog
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Product Guides &amp; Tips</h1>
        <p className="text-gray-500 mt-1.5">Smart buying guides, deal breakdowns, and product reviews</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No posts yet — check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map(post => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] transition-shadow overflow-hidden flex flex-col group"
            >
              {/* Cover image */}
              <div className="relative w-full aspect-[16/9] bg-gray-50">
                {post.cover_image ? (
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-200" />
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                {post.category && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    <Tag className="w-3 h-3" /> {post.category}
                  </span>
                )}
                <h2 className="text-sm font-extrabold text-gray-900 line-clamp-2 leading-snug flex-1">
                  {post.title}
                </h2>
                {post.meta_description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.meta_description}</p>
                )}
                {post.published_at && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
