import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getYouTubeClient } from '@/lib/youtube'
import { Readable } from 'stream'

export const runtime    = 'nodejs'
export const maxDuration = 300   // 5 min — video uploads take time

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login karein pehle' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file      = formData.get('video')      as File   | null
  const productId = formData.get('product_id') as string | null
  const title     = formData.get('title')      as string | null
  const desc      = formData.get('description') as string | null

  if (!file || !productId || !title) {
    return NextResponse.json({ error: 'Video, product aur title zaroori hain' }, { status: 400 })
  }

  // Fetch product for affiliate link in YouTube description
  const { data: product } = await supabase
    .from('products')
    .select('name, original_url, category')
    .eq('id', productId)
    .single()

  const ytDescription = [
    desc ?? '',
    '',
    `🛍️ Yahan se kharido: ${product?.original_url ?? ''}`,
    `📦 Product: ${product?.name ?? ''}`,
    '',
    '⚠️ Affiliate disclosure: Is link se kharidne par humein commission milta hai.',
    '#review #honest #unboxing',
  ].join('\n').trim()

  // Buffer → Readable stream (googleapis needs a stream)
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const stream = Readable.from(buffer)

  let youtubeVideoId: string
  try {
    const youtube = getYouTubeClient()
    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description: ytDescription,
          tags: ['review', product?.name ?? '', product?.category ?? '', 'unboxing'].filter(Boolean),
          categoryId: '26',         // Howto & Style
          defaultLanguage: 'hi',
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType: file.type || 'video/mp4',
        body: stream,
      },
    })
    youtubeVideoId = res.data.id!
  } catch (err: any) {
    console.error('YouTube upload error:', err?.message)
    return NextResponse.json(
      { error: `YouTube upload fail hua: ${err?.message ?? 'Unknown error'}` },
      { status: 500 }
    )
  }

  // Save to DB
  const { data: videoReview, error: dbError } = await supabase
    .from('video_reviews')
    .insert({
      product_id:       productId,
      reviewer_id:      user.id,
      youtube_video_id: youtubeVideoId,
      title,
      description:      desc ?? null,
      status:           'live',
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, youtubeVideoId, videoReview })
}
