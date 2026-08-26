import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getYouTubeClient } from '@/lib/youtube'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { videoId } = await params

  const { data: row } = await supabase
    .from('video_reviews')
    .select('youtube_video_id')
    .eq('id', videoId)
    .single()

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from YouTube (best-effort — don't fail if already removed)
  try {
    const youtube = getYouTubeClient()
    await youtube.videos.delete({ id: row.youtube_video_id })
  } catch (err: any) {
    console.warn('YouTube delete skipped:', err?.message)
  }

  await supabase.from('video_reviews').delete().eq('id', videoId)

  return NextResponse.json({ success: true })
}
