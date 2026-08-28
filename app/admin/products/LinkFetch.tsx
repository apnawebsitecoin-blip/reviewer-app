'use client'
import { useState, useCallback } from 'react'
import {
  Link2, Loader2, CheckCircle2, AlertCircle, XCircle,
  X, Upload, RefreshCw, ExternalLink,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
type LinkPhase = 'idle' | 'fetching' | 'review' | 'uploading' | 'done'
type FetchStatus = 'pending' | 'ok' | 'partial' | 'error'

interface FetchedRow {
  id: string
  original_url: string
  name: string
  price: string
  category: string
  platform: string
  image_url: string
  fetchStatus: FetchStatus
  fetchError?: string
  imageError?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('amazon.in') || u.includes('amazon.com')) return 'Amazon'
  if (u.includes('flipkart.com'))  return 'Flipkart'
  if (u.includes('meesho.com'))    return 'Meesho'
  if (u.includes('myntra.com'))    return 'Myntra'
  if (u.includes('snapdeal.com'))  return 'Snapdeal'
  if (u.includes('ajio.com'))      return 'AJIO'
  if (u.includes('nykaa.com'))     return 'Nykaa'
  if (u.includes('jiomart.com'))   return 'JioMart'
  return 'Other'
}

const CONCURRENCY = 3
const BATCH_SIZE  = 50

// ── Main component ─────────────────────────────────────────────────────────────
export default function LinkFetch() {
  const [phase, setPhase]               = useState<LinkPhase>('idle')
  const [linksText, setLinksText]       = useState('')
  const [rows, setRows]                 = useState<FetchedRow[]>([])
  const [fetchDone, setFetchDone]       = useState(0)
  const [fetchTotal, setFetchTotal]     = useState(0)
  const [uploadProgress, setProgress]   = useState(0)
  const [uploadStats, setStats]         = useState({ inserted: 0, failed: 0 })
  const [uploadErrors, setUploadErrors] = useState<string[]>([])

  const updateRow = useCallback((id: string, field: keyof FetchedRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }, [])

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id))
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const handleFetch = async () => {
    const urls = [...new Set(
      linksText.split('\n').map(s => s.trim()).filter(s => s.startsWith('http'))
    )]
    if (!urls.length) return

    const initial: FetchedRow[] = urls.map(url => ({
      id: crypto.randomUUID(),
      original_url: url,
      name: '', price: '', category: '',
      platform: detectPlatform(url),
      image_url: '',
      fetchStatus: 'pending',
    }))

    setRows(initial)
    setFetchDone(0)
    setFetchTotal(urls.length)
    setPhase('fetching')

    // Bounded concurrency pool
    let nextIdx = 0
    let done = 0

    const worker = async () => {
      while (nextIdx < urls.length) {
        const i = nextIdx++
        const rowId = initial[i].id

        try {
          const res = await fetch('/api/admin/scrape-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urls[i] }),
          })
          const data = await res.json()
          const hasName  = !!data.name
          const hasPrice = data.price != null

          setRows(prev => prev.map(r => r.id !== rowId ? r : {
            ...r,
            name:        data.name ?? '',
            price:       data.price != null ? String(data.price) : '',
            platform:    data.platform ?? r.platform,
            image_url:   data.image_url ?? '',
            fetchStatus: data.error ? 'error'
                        : hasName && hasPrice ? 'ok'
                        : hasName ? 'partial'
                        : 'error',
            fetchError:  data.error ?? undefined,
            imageError:  data.image_error ?? undefined,
          }))
        } catch {
          setRows(prev => prev.map(r =>
            r.id !== rowId ? r : { ...r, fetchStatus: 'error', fetchError: 'Network error' }
          ))
        }

        done++
        setFetchDone(done)
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker))
    setPhase('review')
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const valid = rows.filter(r => r.name.trim() && r.original_url)
    if (!valid.length) return

    setPhase('uploading')
    setProgress(0)
    const errors: string[] = []
    let inserted = 0, failed = 0

    const batches: FetchedRow[][] = []
    for (let i = 0; i < valid.length; i += BATCH_SIZE) batches.push(valid.slice(i, i + BATCH_SIZE))

    for (let b = 0; b < batches.length; b++) {
      try {
        const res = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batches[b].map(r => ({
              name: r.name.trim(),
              price: r.price,
              category: r.category,
              platform: r.platform,
              original_url: r.original_url,
              image_url: r.image_url,
            })),
          }),
        })
        const data = await res.json()
        inserted += data.inserted ?? 0
        if (data.error) {
          failed += batches[b].length - (data.inserted ?? 0)
          errors.push(`Batch ${b + 1}: ${data.error}`)
        }
      } catch {
        failed += batches[b].length
        errors.push(`Batch ${b + 1}: Network error`)
      }
      setProgress(Math.round(((b + 1) / batches.length) * 100))
    }

    setStats({ inserted, failed })
    setUploadErrors(errors)
    setPhase('done')
  }

  const reset = () => {
    setPhase('idle'); setLinksText(''); setRows([])
    setFetchDone(0); setFetchTotal(0); setProgress(0)
    setStats({ inserted: 0, failed: 0 }); setUploadErrors([])
  }

  const validForUpload = rows.filter(r => r.name.trim() && r.original_url)
  const urlCount = linksText.split('\n').filter(s => s.trim().startsWith('http')).length

  // ── Render: idle ───────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Ek line mein ek product URL paste karo. Amazon, Flipkart, Meesho, Myntra aur zyada platforms supported hain.
          System naam, price aur image auto-fetch karega — phir aap edit karke upload kar sakte ho.
        </p>
        <textarea
          value={linksText}
          onChange={e => setLinksText(e.target.value)}
          rows={6}
          placeholder={[
            'https://www.amazon.in/dp/B0CHX3TK7D',
            'https://www.flipkart.com/samsung-galaxy-s24/p/itm...',
            'https://www.meesho.com/product/...',
          ].join('\n')}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-gray-300"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            {urlCount} valid URL{urlCount !== 1 ? 's' : ''} detected
          </p>
          <button
            onClick={handleFetch}
            disabled={urlCount === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Fetch Product Data
          </button>
        </div>
      </div>
    )
  }

  // ── Render: fetching / review ──────────────────────────────────────────────
  if (phase === 'fetching' || phase === 'review') {
    const okCount      = rows.filter(r => r.fetchStatus === 'ok').length
    const partialCount = rows.filter(r => r.fetchStatus === 'partial').length
    const errCount     = rows.filter(r => r.fetchStatus === 'error').length

    return (
      <div className="space-y-4">
        {/* Status bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {phase === 'fetching' ? (
              <span className="flex items-center gap-2 font-semibold text-indigo-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching {fetchDone} / {fetchTotal}…
              </span>
            ) : (
              <span className="font-bold text-gray-700">{rows.length} URLs processed</span>
            )}
            {okCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                <CheckCircle2 className="w-3 h-3" /> {okCount} complete
              </span>
            )}
            {partialCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                <AlertCircle className="w-3 h-3" /> {partialCount} partial
              </span>
            )}
            {errCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                <XCircle className="w-3 h-3" /> {errCount} failed
              </span>
            )}
          </div>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
            <X className="w-3.5 h-3.5" /> Start Over
          </button>
        </div>

        {/* Editable table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-xs min-w-[740px]">
            <thead>
              <tr className="bg-gray-50 text-gray-400 uppercase tracking-widest text-[10px]">
                <th className="px-3 py-2.5 w-8 text-left"></th>
                <th className="px-2 py-2.5 w-12 text-left">Img</th>
                <th className="px-3 py-2.5 text-left">Name *</th>
                <th className="px-3 py-2.5 w-24 text-left">Price ₹</th>
                <th className="px-3 py-2.5 w-28 text-left">Category</th>
                <th className="px-3 py-2.5 w-24 text-left">Platform</th>
                <th className="px-3 py-2.5 w-36 text-left">Image URL</th>
                <th className="px-3 py-2.5 w-10 text-center">OK?</th>
                <th className="px-2 py-2.5 w-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(row => {
                const isPending = row.fetchStatus === 'pending'
                const isError   = row.fetchStatus === 'error'
                return (
                  <tr
                    key={row.id}
                    className={`group transition-colors ${isError && !row.name ? 'bg-red-50/40' : 'hover:bg-gray-50/60'}`}
                  >
                    {/* Source link */}
                    <td className="px-3 py-2">
                      <a
                        href={row.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={row.original_url}
                        className="text-gray-300 hover:text-indigo-500 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>

                    {/* Thumbnail */}
                    <td className="px-2 py-1.5">
                      {isPending ? (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
                      ) : row.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image_url} alt="" className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-100" />
                      ) : (
                        <div
                          className="w-10 h-10 bg-amber-50 border border-dashed border-amber-300 rounded-lg flex items-center justify-center p-0.5"
                          title="No image found — manually add image URL in the row"
                        >
                          <span className="text-[8px] text-amber-500 font-bold text-center leading-tight">
                            No image — add manually
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-3 py-1.5 min-w-[200px]">
                      {isPending ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-44" />
                      ) : (
                        <input
                          value={row.name}
                          onChange={e => updateRow(row.id, 'name', e.target.value)}
                          className="w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 text-xs bg-transparent py-0.5 focus:outline-none text-gray-800 placeholder-gray-400 transition-colors"
                          placeholder="Product name…"
                        />
                      )}
                      {row.fetchError && (
                        <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[220px]" title={row.fetchError}>
                          ⚠ {row.fetchError}
                        </p>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-3 py-1.5">
                      {isPending ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                      ) : (
                        <input
                          type="number"
                          value={row.price}
                          onChange={e => updateRow(row.id, 'price', e.target.value)}
                          className="w-20 border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 text-xs bg-transparent py-0.5 focus:outline-none text-gray-800 transition-colors"
                          placeholder="0"
                          min="0"
                        />
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-1.5">
                      {isPending ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      ) : (
                        <input
                          value={row.category}
                          onChange={e => updateRow(row.id, 'category', e.target.value)}
                          className="w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 text-xs bg-transparent py-0.5 focus:outline-none text-gray-800 transition-colors"
                          placeholder="Category…"
                        />
                      )}
                    </td>

                    {/* Platform */}
                    <td className="px-3 py-1.5">
                      {isPending ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                      ) : (
                        <input
                          value={row.platform}
                          onChange={e => updateRow(row.id, 'platform', e.target.value)}
                          className="w-20 border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 text-xs bg-transparent py-0.5 focus:outline-none text-gray-800 transition-colors"
                        />
                      )}
                    </td>

                    {/* Image URL */}
                    <td className="px-3 py-1.5">
                      {isPending ? (
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      ) : (
                        <>
                          <input
                            value={row.image_url}
                            onChange={e => updateRow(row.id, 'image_url', e.target.value)}
                            className="w-32 border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 text-xs bg-transparent py-0.5 focus:outline-none text-gray-800 transition-colors"
                            placeholder="Paste image URL…"
                          />
                          {!row.image_url && row.imageError && (
                            <p className="text-[9px] text-amber-500 leading-tight mt-0.5 max-w-[130px]" title={row.imageError}>
                              ⚠ {row.imageError}
                            </p>
                          )}
                        </>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      {isPending ? (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin inline" />
                      ) : row.fetchStatus === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                      ) : row.fetchStatus === 'partial' ? (
                        <span title="Partial — fill in missing fields"><AlertCircle className="w-4 h-4 text-amber-400 inline" /></span>
                      ) : (
                        <span title={row.fetchError ?? 'Fetch failed — fill manually'}><XCircle className="w-4 h-4 text-red-400 inline" /></span>
                      )}
                    </td>

                    {/* Remove */}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove row"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-400">
          * Name zaroori hai. Koi bhi field edit karo. Hover karke row remove karo. Error wali rows ko manually fill karke bhi upload kar sakte ho.
        </p>

        {/* Upload button — only in review phase */}
        {phase === 'review' && (
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
            {validForUpload.length > 0 ? (
              <button
                onClick={handleUpload}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Add {validForUpload.length} Product{validForUpload.length !== 1 ? 's' : ''} to Catalog
                {rows.length - validForUpload.length > 0 && (
                  <span className="text-white/60 font-normal">
                    ({rows.length - validForUpload.length} skipped)
                  </span>
                )}
              </button>
            ) : (
              <p className="text-sm text-red-600 font-semibold">
                Name column khaali hai — upload se pehle fill karo.
              </p>
            )}
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Phir se try karo
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Render: uploading ──────────────────────────────────────────────────────
  if (phase === 'uploading') {
    return (
      <div className="py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-800">Uploading products…</p>
            <p className="text-xs text-gray-400 mt-0.5">Tab band mat karo</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{uploadProgress}% complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── Render: done ───────────────────────────────────────────────────────────
  return (
    <div className="py-4 space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-gray-800">Upload Complete!</p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="text-green-700 font-semibold">{uploadStats.inserted} products</span> successfully added
            {uploadStats.failed > 0 && (
              <>, <span className="text-red-600 font-semibold">{uploadStats.failed} failed</span></>
            )}
          </p>
        </div>
      </div>

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          {uploadErrors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      <button
        onClick={reset}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Aur links add karo
      </button>
    </div>
  )
}
