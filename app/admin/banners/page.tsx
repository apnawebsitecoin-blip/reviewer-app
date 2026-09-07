'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Image, Plus, Trash2, Loader2, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, GalleryHorizontal,
} from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

interface HomeBanner {
  id: string
  image_url: string | null
  title: string
  subtitle: string | null
  link_url: string | null
  display_order: number
  is_active: boolean
  platform: string | null
  created_at: string
}

const EMPTY = { title: '', subtitle: '', image_url: '', link_url: '', platform: '', display_order: '0' }

export default function AdminBannersPage() {
  const supabase = createClient()
  const [banners,  setBanners]  = useState<HomeBanner[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [form,     setForm]     = useState({ ...EMPTY })

  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data }) => setBanners((data as HomeBanner[]) ?? []))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('home_banners').insert({
      title:         form.title,
      subtitle:      form.subtitle || null,
      image_url:     form.image_url || null,
      link_url:      form.link_url || null,
      platform:      form.platform || null,
      display_order: parseInt(form.display_order) || 0,
      is_active:     true,
    }).select().single()
    if (data && !error) setBanners(prev => [...prev, data as HomeBanner].sort((a, b) => a.display_order - b.display_order))
    setForm({ ...EMPTY })
    setOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    setDeleting(id)
    await supabase.from('home_banners').delete().eq('id', id)
    setBanners(prev => prev.filter(b => b.id !== id))
    setDeleting(null)
  }

  const handleToggle = async (banner: HomeBanner) => {
    setToggling(banner.id)
    await supabase.from('home_banners').update({ is_active: !banner.is_active }).eq('id', banner.id)
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
    setToggling(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Home Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">Control the hero carousel on the Raikaro mobile app</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
            {banners.length} banners
          </span>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Banner
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Add form */}
      {open && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">New Banner</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL}>Title *</label>
              <input required className={INPUT} placeholder="e.g. Flat 10% Cashback on Amazon" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Subtitle</label>
              <input className={INPUT} placeholder="e.g. Limited time offer — shop now!" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={LABEL}>Image URL</label>
              <input className={INPUT} placeholder="https://..." value={form.image_url} onChange={e => set('image_url', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Link URL (optional)</label>
              <input className={INPUT} placeholder="https://..." value={form.link_url} onChange={e => set('link_url', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Platform (optional)</label>
              <input className={INPUT} placeholder="Amazon / Flipkart / Meesho..." value={form.platform} onChange={e => set('platform', e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Display Order</label>
              <input type="number" className={INPUT} value={form.display_order} onChange={e => set('display_order', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Banner
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* SQL Setup note */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>First-time setup:</strong> Run this SQL in Supabase Dashboard → SQL Editor if the table doesn&apos;t exist yet:
        <pre className="mt-2 bg-amber-100 rounded-lg p-3 text-xs overflow-x-auto text-amber-900 font-mono">{`CREATE TABLE public.home_banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  title TEXT NOT NULL,
  subtitle TEXT,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active banners"
  ON public.home_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage banners"
  ON public.home_banners USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );`}</pre>
      </div>

      {/* Banner list */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <GalleryHorizontal className="w-6 h-6 text-indigo-300" />
          </div>
          <p className="text-sm text-gray-400">No banners yet — add one above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-4 flex items-center gap-4">
              {/* Preview */}
              {b.image_url ? (
                <img src={b.image_url} alt={b.title} className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
              ) : (
                <div className="w-20 h-14 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-indigo-300" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{b.title}</p>
                {b.subtitle && <p className="text-xs text-gray-400 truncate mt-0.5">{b.subtitle}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {b.platform && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{b.platform}</span>}
                  <span className="text-xs text-gray-400">Order: {b.display_order}</span>
                  {b.link_url && <span className="text-xs text-indigo-400 truncate max-w-[180px]">{b.link_url}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggle(b)}
                  disabled={toggling === b.id}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition"
                  style={{ borderColor: b.is_active ? '#86efac' : '#e5e7eb', color: b.is_active ? '#16a34a' : '#9ca3af', backgroundColor: b.is_active ? '#f0fdf4' : '#f9fafb' }}
                >
                  {toggling === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : b.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {b.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  disabled={deleting === b.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  {deleting === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
