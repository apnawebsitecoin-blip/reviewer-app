'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Plus, Pencil, Trash2, Loader2, X, Save, Eye, EyeOff } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'
const LABEL = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

const BLOG_CATEGORIES = ['Deal Guide', 'Buying Guide', 'News', 'Review', 'Tips', 'Other']

interface Post {
  id: string
  title: string
  slug: string
  content: string
  cover_image: string | null
  category: string | null
  meta_description: string | null
  published_at: string | null
  created_at: string
}

const EMPTY_FORM = {
  title: '', slug: '', content: '', cover_image: '',
  category: 'Buying Guide', meta_description: '', published_at: '',
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminBlogPage() {
  const supabase = createClient()
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]       = useState('')
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const openAdd = () => {
    setEditPost(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (p: Post) => {
    setEditPost(p)
    setForm({
      title:            p.title,
      slug:             p.slug,
      content:          p.content,
      cover_image:      p.cover_image ?? '',
      category:         p.category ?? 'Buying Guide',
      meta_description: p.meta_description ?? '',
      published_at:     p.published_at ? p.published_at.slice(0, 16) : '',
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditPost(null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title:            form.title,
      slug:             form.slug || slugify(form.title),
      content:          form.content,
      cover_image:      form.cover_image || null,
      category:         form.category || null,
      meta_description: form.meta_description || null,
      published_at:     form.published_at ? new Date(form.published_at).toISOString() : null,
    }

    const { error: err } = editPost
      ? await supabase.from('blog_posts').update(payload).eq('id', editPost.id)
      : await supabase.from('blog_posts').insert(payload)

    if (err) { setError(err.message); setSaving(false); return }
    await fetchPosts()
    closeForm()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Is post ko delete karein?')) return
    setDeleting(id)
    await supabase.from('blog_posts').delete().eq('id', id)
    await fetchPosts()
    setDeleting(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Blog &amp; Guides</h1>
          <p className="text-sm text-gray-400 mt-0.5">SEO posts, product guides, and buying tips</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-black text-gray-900">{editPost ? 'Edit Post' : 'New Blog Post'}</h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={LABEL}>Title *</label>
                  <input type="text" required value={form.title}
                    onChange={e => { set('title', e.target.value); if (!editPost) set('slug', slugify(e.target.value)) }}
                    className={INPUT} placeholder="Best Budget Phones Under ₹15,000" />
                </div>
                <div>
                  <label className={LABEL}>Slug *</label>
                  <input type="text" required value={form.slug}
                    onChange={e => set('slug', e.target.value)} className={INPUT} placeholder="best-budget-phones" />
                </div>
                <div>
                  <label className={LABEL}>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)} className={INPUT}>
                    {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Cover Image URL</label>
                  <input type="url" value={form.cover_image}
                    onChange={e => set('cover_image', e.target.value)} className={INPUT} placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Meta Description (for SEO)</label>
                  <input type="text" value={form.meta_description}
                    onChange={e => set('meta_description', e.target.value)} className={INPUT}
                    placeholder="Short description for search engines (max 160 chars)" maxLength={160} />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Content *</label>
                  <textarea required value={form.content}
                    onChange={e => set('content', e.target.value)}
                    rows={10}
                    className={`${INPUT} resize-y font-mono text-xs`}
                    placeholder="Write your post content here..." />
                </div>
                <div>
                  <label className={LABEL}>Publish At (leave empty for draft)</label>
                  <input type="datetime-local" value={form.published_at}
                    onChange={e => set('published_at', e.target.value)} className={INPUT} />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><Save className="w-4 h-4" /> {editPost ? 'Save Changes' : 'Publish Post'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No posts yet — click &quot;New Post&quot; to start</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map(p => {
                const isPublished = !!p.published_at && new Date(p.published_at) <= new Date()
                return (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 max-w-[220px] line-clamp-1">{p.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">{p.slug}</code>
                    </td>
                    <td className="px-4 py-3">
                      {p.category
                        ? <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{p.category}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isPublished ? <><Eye className="w-3 h-3" /> Published</> : <><EyeOff className="w-3 h-3" /> Draft</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} title="Edit"
                          className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} title="Delete"
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                          {deleting === p.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
