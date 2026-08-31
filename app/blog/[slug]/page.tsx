import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/settings'
import type { Metadata } from 'next'
import { BookOpen, Calendar, Tag, ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, meta_description, cover_image')
    .eq('slug', slug)
    .single()

  if (!post) return { title: 'Post not found' }

  const settings = await getSiteSettings()
  return {
    title: `${post.title} — ${settings.siteName}`,
    description: post.meta_description ?? undefined,
    openGraph: {
      title: post.title,
      description: post.meta_description ?? undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Back */}
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 font-semibold mb-6 transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> All Guides
      </Link>

      {/* Category + date */}
      <div className="flex items-center gap-3 mb-3">
        {post.category && (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <Tag className="w-3 h-3" /> {post.category}
          </span>
        )}
        {post.published_at && (
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(post.published_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-5">
        {post.title}
      </h1>

      {/* Cover image */}
      {post.cover_image && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 shadow-md">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Content — rendered as plain whitespace-preserved text */}
      <article className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </article>

      {/* Footer back link */}
      <div className="mt-10 pt-6 border-t border-gray-100">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline">
          <BookOpen className="w-4 h-4" /> More Guides
        </Link>
      </div>
    </div>
  )
}
