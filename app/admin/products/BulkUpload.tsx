'use client'

import { useRef, useState, useCallback } from 'react'
import {
  Upload, Download, FileSpreadsheet, CheckCircle2,
  AlertCircle, X, ChevronDown, ChevronUp, Loader2, Link2,
} from 'lucide-react'
import LinkFetch from './LinkFetch'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawRow {
  rowNum: number    // 1-based (excludes header)
  name: string
  price: string
  category: string
  platform: string
  original_url: string
  image_url: string
}

interface RowValidation {
  rowNum: number
  errors: string[]
}

type Phase = 'idle' | 'preview' | 'uploading' | 'done'

const BATCH_SIZE = 50
const PREVIEW_LIMIT = 100

const EXPECTED_HEADERS = ['name', 'price', 'category', 'platform', 'original_url', 'image_url']

const SAMPLE_CSV = [
  'name,price,category,platform,original_url,image_url',
  '"iPhone 15 Pro",89999,Electronics,Amazon,https://amazon.in/dp/B0CHX3TK7D,https://example.com/iphone.jpg',
  '"Samsung Galaxy S24",74999,Electronics,Flipkart,https://flipkart.com/p/samsung-s24,https://example.com/samsung.jpg',
  '"Nike Air Max 270",5999,Fashion,Amazon,https://amazon.in/dp/B07XXXXXX,',
  '"Prestige Cooker 5L",1299,Kitchen,Amazon,https://amazon.in/dp/B06XXXXXX,https://example.com/cooker.jpg',
].join('\n')

// ── CSV parser (no dependency) ────────────────────────────────────────────────

function parseCSVText(raw: string): string[][] {
  const text = raw.replace(/^﻿/, '') // strip BOM
  const rows: string[][] = []
  let pos = 0

  while (pos < text.length) {
    const cells: string[] = []

    while (true) {
      let cell = ''
      if (text[pos] === '"') {
        pos++
        while (pos < text.length) {
          if (text[pos] === '"') {
            if (text[pos + 1] === '"') { cell += '"'; pos += 2 }
            else { pos++; break }
          } else {
            cell += text[pos++]
          }
        }
      } else {
        while (pos < text.length && text[pos] !== ',' && text[pos] !== '\n' && text[pos] !== '\r') {
          cell += text[pos++]
        }
      }
      cells.push(cell.trim())
      if (pos >= text.length || text[pos] === '\n' || text[pos] === '\r') break
      pos++ // skip comma
    }

    if (pos < text.length) {
      if (text[pos] === '\r') pos++
      if (text[pos] === '\n') pos++
    }

    if (cells.some(c => c.length > 0)) rows.push(cells)
  }
  return rows
}

// ── Map raw 2D array → RawRow objects ─────────────────────────────────────────

function mapToRows(matrix: string[][]): { rows: RawRow[]; headerError: string | null } {
  if (matrix.length === 0) return { rows: [], headerError: 'File is empty.' }

  const header = matrix[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'))

  // Accept flexible header names
  const colIndex = {
    name:         header.findIndex(h => ['name', 'product_name', 'product name', 'title'].includes(h)),
    price:        header.findIndex(h => ['price', 'mrp', 'amount'].includes(h)),
    category:     header.findIndex(h => ['category', 'cat'].includes(h)),
    platform:     header.findIndex(h => ['platform', 'store', 'source'].includes(h)),
    original_url: header.findIndex(h => ['original_url', 'url', 'affiliate_link', 'affiliate link', 'link'].includes(h)),
    image_url:    header.findIndex(h => ['image_url', 'image', 'image_link', 'photo'].includes(h)),
  }

  if (colIndex.name === -1 || colIndex.original_url === -1) {
    return {
      rows: [],
      headerError: `Required columns not found. Need at minimum: "name" and "original_url" (or "affiliate_link"). Found: ${header.join(', ')}`,
    }
  }

  const get = (row: string[], key: keyof typeof colIndex) =>
    colIndex[key] >= 0 ? (row[colIndex[key]] ?? '').trim() : ''

  const rows: RawRow[] = matrix.slice(1).map((row, i) => ({
    rowNum: i + 2, // row 2 = first data row (header is row 1)
    name: get(row, 'name'),
    price: get(row, 'price'),
    category: get(row, 'category'),
    platform: get(row, 'platform'),
    original_url: get(row, 'original_url'),
    image_url: get(row, 'image_url'),
  }))

  return { rows, headerError: null }
}

// ── Row validator ──────────────────────────────────────────────────────────────

function validateRow(row: RawRow): string[] {
  const errs: string[] = []
  if (!row.name) errs.push('Name is required')
  if (!row.original_url) {
    errs.push('Affiliate link (original_url) is required')
  } else if (!/^https?:\/\//i.test(row.original_url)) {
    errs.push('Affiliate link must start with http:// or https://')
  }
  if (row.price && !/^\d+(\.\d+)?$/.test(row.price.replace(/,/g, ''))) {
    errs.push(`Price "${row.price}" is not a valid number`)
  }
  if (row.image_url && !/^https?:\/\//i.test(row.image_url)) {
    errs.push('Image URL must start with http:// or https://')
  }
  return errs
}

// ── Chunk helper ───────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BulkUpload() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'csv' | 'links'>('csv')
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [allRows, setAllRows] = useState<RawRow[]>([])
  const [validations, setValidations] = useState<RowValidation[]>([])
  const [progress, setProgress] = useState(0)
  const [currentBatch, setCurrentBatch] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const [stats, setStats] = useState({ inserted: 0, failed: 0 })
  const [batchErrors, setBatchErrors] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const validRows = allRows.filter((r) => !validations.find(v => v.rowNum === r.rowNum))
  const errorRows = validations

  // ── Parse file ───────────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setParseError('')
    setFileName(file.name)

    const ext = file.name.split('.').pop()?.toLowerCase()
    let matrix: string[][] = []

    try {
      if (ext === 'csv' || ext === 'txt') {
        const text = await file.text()
        matrix = parseCSVText(text)
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Lazy-load xlsx only when needed
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
        matrix = matrix.filter((row: string[]) => row.some((c: string) => String(c).trim()))
      } else {
        setParseError('Unsupported file type. Please upload a .csv or .xlsx file.')
        return
      }
    } catch (e: any) {
      setParseError(`Could not read file: ${e.message}`)
      return
    }

    const { rows, headerError } = mapToRows(matrix)
    if (headerError) { setParseError(headerError); return }

    const validationResults: RowValidation[] = rows
      .map(r => ({ rowNum: r.rowNum, errors: validateRow(r) }))
      .filter(v => v.errors.length > 0)

    setAllRows(rows)
    setValidations(validationResults)
    setPhase('preview')
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = '' // allow re-selecting same file
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Upload ────────────────────────────────────────────────────────────────────

  const startUpload = async () => {
    if (!validRows.length) return
    setPhase('uploading')
    setBatchErrors([])

    const batches = chunk(validRows, BATCH_SIZE)
    setTotalBatches(batches.length)
    let inserted = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < batches.length; i++) {
      setCurrentBatch(i + 1)
      try {
        const res = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: batches[i] }),
        })
        const data = await res.json()
        inserted += data.inserted ?? 0
        if (data.error) {
          failed += batches[i].length - (data.inserted ?? 0)
          errors.push(`Batch ${i + 1}: ${data.error}`)
        }
      } catch {
        failed += batches[i].length
        errors.push(`Batch ${i + 1}: Network error — will not retry`)
      }
      setProgress(Math.round(((i + 1) / batches.length) * 100))
    }

    setStats({ inserted, failed })
    setBatchErrors(errors)
    setPhase('done')
  }

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const reset = () => {
    setPhase('idle')
    setAllRows([])
    setValidations([])
    setProgress(0)
    setCurrentBatch(0)
    setTotalBatches(0)
    setStats({ inserted: 0, failed: 0 })
    setBatchErrors([])
    setFileName('')
    setParseError('')
  }

  // ── Download template ─────────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reviewapp-bulk-upload-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow mb-6 overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800">Bulk Upload Products</p>
            <p className="text-xs text-gray-400">CSV ya Excel file se ek saath hazaron products add karo</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Mode tabs */}
          <div className="flex border-b border-gray-100">
            <button
              type="button"
              onClick={() => setMode('csv')}
              className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
                mode === 'csv'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> CSV / Excel
            </button>
            <button
              type="button"
              onClick={() => setMode('links')}
              className={`px-5 py-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
                mode === 'links'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Link2 className="w-4 h-4" /> Add via Links
            </button>
          </div>

          {/* Links mode */}
          {mode === 'links' && (
            <div className="px-5 py-5">
              <LinkFetch />
            </div>
          )}

          {/* CSV mode */}
          {mode === 'csv' && <div className="px-5 py-5">

          {/* ── IDLE phase ── */}
          {phase === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" /> Download Sample Template
                </button>
                <p className="text-xs text-gray-400">Columns: name, price, category, platform, original_url, image_url</p>
              </div>

              {/* Drop zone */}
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  CSV ya Excel file yahan drop karo
                </p>
                <p className="text-xs text-gray-400 mb-4">ya click karke browse karo</p>
                <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-5 py-2 rounded-lg">
                  File Choose Karo
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* ── PREVIEW phase ── */}
          {phase === 'preview' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-bold text-gray-700">
                    📄 {fileName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {validRows.length} valid
                  </span>
                  {errorRows.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorRows.length} errors
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{allRows.length} total rows</span>
                </div>
                <button type="button" onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Reset
                </button>
              </div>

              {/* Row errors */}
              {errorRows.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
                    ❌ {errorRows.length} Row{errorRows.length > 1 ? 's' : ''} with Errors (skipped during upload)
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {errorRows.map(v => (
                      <div key={v.rowNum} className="text-xs text-red-700">
                        <span className="font-semibold">Row {v.rowNum}:</span>{' '}
                        {v.errors.join(' · ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Preview {Math.min(allRows.length, PREVIEW_LIMIT)} of {allRows.length} rows
                  {allRows.length > PREVIEW_LIMIT && ` (first ${PREVIEW_LIMIT} shown)`}
                </p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2.5 text-left font-semibold w-10">#</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Name</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Price</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Category</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Platform</th>
                        <th className="px-3 py-2.5 text-left font-semibold">Affiliate Link</th>
                        <th className="px-3 py-2.5 text-left font-semibold w-10">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allRows.slice(0, PREVIEW_LIMIT).map(row => {
                        const errs = validations.find(v => v.rowNum === row.rowNum)?.errors
                        return (
                          <tr
                            key={row.rowNum}
                            className={errs ? 'bg-red-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-3 py-2 text-gray-400">{row.rowNum}</td>
                            <td className="px-3 py-2 text-gray-800 font-medium max-w-[180px] truncate">
                              {row.name || <span className="text-red-400 italic">missing</span>}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{row.price || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{row.category || '—'}</td>
                            <td className="px-3 py-2 text-gray-600">{row.platform || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">
                              {row.original_url || <span className="text-red-400 italic">missing</span>}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {errs
                                ? <span title={errs.join('\n')}><AlertCircle className="w-4 h-4 text-red-400 inline" /></span>
                                : <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap pt-1">
                {validRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={startUpload}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload {validRows.length} Valid Product{validRows.length !== 1 ? 's' : ''}
                    {errorRows.length > 0 && ` (${errorRows.length} skipped)`}
                  </button>
                ) : (
                  <p className="text-sm text-red-600 font-semibold">No valid rows to upload — fix the errors above.</p>
                )}
                <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
                  Choose Different File
                </button>
              </div>
            </div>
          )}

          {/* ── UPLOADING phase ── */}
          {phase === 'uploading' && (
            <div className="py-6 space-y-5">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    Uploading batch {currentBatch} of {totalBatches}…
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {validRows.length} products · {BATCH_SIZE} per batch · please don't close this tab
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{progress}% complete</span>
                  <span>~{Math.ceil((totalBatches - currentBatch) * 1.5)}s remaining</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  {Array.from({ length: totalBatches }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-1 rounded-full ${i < currentBatch ? 'bg-indigo-500' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DONE phase ── */}
          {phase === 'done' && (
            <div className="py-4 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-800">
                    Upload Complete!
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="text-green-700 font-semibold">{stats.inserted} products</span> successfully added
                    {stats.failed > 0 && (
                      <>, <span className="text-red-600 font-semibold">{stats.failed} failed</span></>
                    )}
                  </p>
                </div>
              </div>

              {batchErrors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-700 mb-2">Batch Errors:</p>
                  {batchErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" /> Upload Another File
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-sm text-gray-500 hover:text-gray-800 font-medium border border-gray-200 px-5 py-2 rounded-xl transition-colors"
                >
                  Refresh Products List
                </button>
              </div>
            </div>
          )}

          </div>} {/* end CSV mode */}
        </div>
      )}
    </div>
  )
}
