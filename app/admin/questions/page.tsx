'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HelpCircle, Loader2, CheckCircle2, MessageCircle } from 'lucide-react'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition bg-white'

interface QuestionRow {
  id: string
  product_id: string
  asked_by: string
  question_text: string
  answer_text: string | null
  answered_by: string | null
  created_at: string
  profiles: { id: string; name: string | null } | null
  products: { id: string; name: string } | null
}

type FilterTab = 'all' | 'unanswered'

export default function AdminQuestionsPage() {
  const supabase = createClient()
  const [questions,   setQuestions]   = useState<QuestionRow[]>([])
  const [filter,      setFilter]      = useState<FilterTab>('unanswered')
  const [loading,     setLoading]     = useState(true)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText,  setAnswerText]  = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  const fetchQuestions = async (tab: FilterTab) => {
    setLoading(true)
    let q = supabase
      .from('questions')
      .select('*, profiles(id, name), products(id, name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (tab === 'unanswered') q = q.is('answer_text', null)
    const { data } = await q
    setQuestions((data as QuestionRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchQuestions(filter) }, [])

  const handleTabChange = (tab: FilterTab) => {
    setFilter(tab)
    setAnsweringId(null)
    setAnswerText('')
    fetchQuestions(tab)
  }

  const handleAnswer = async (question: QuestionRow) => {
    if (!answerText.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('questions')
      .update({ answer_text: answerText.trim(), answered_by: user?.id ?? null })
      .eq('id', question.id)

    // Notify asker
    if (question.asked_by && question.asked_by !== user?.id) {
      await supabase.from('notifications').insert({
        user_id: question.asked_by,
        message: `Your question was answered: "${question.question_text.slice(0, 50)}${question.question_text.length > 50 ? '…' : ''}"`,
      })
    }

    setQuestions(prev =>
      filter === 'unanswered'
        ? prev.filter(q => q.id !== question.id)
        : prev.map(q => q.id === question.id ? { ...q, answer_text: answerText.trim(), answered_by: user?.id ?? null } : q)
    )
    setAnsweringId(null)
    setAnswerText('')
    setSubmitting(false)
  }

  const unansweredCount = questions.filter(q => !q.answer_text).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Q&A Moderation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Answer customer questions from a single queue</p>
        </div>
        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-sm font-bold px-3 py-1 rounded-full">
          {filter === 'unanswered' ? questions.length : unansweredCount} unanswered
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'unanswered', label: 'Unanswered' },
          { key: 'all',        label: 'All Questions' },
        ] as { key: FilterTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {filter === 'unanswered' ? 'All questions answered — inbox zero!' : 'No questions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-5"
            >
              {/* Product + meta */}
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {q.products?.name ?? q.product_id}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    by {q.profiles?.name ?? 'Unknown'} ·{' '}
                    {new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {q.answer_text ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Answered
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                    <MessageCircle className="w-3 h-3" /> Needs answer
                  </span>
                )}
              </div>

              {/* Question */}
              <p className="text-sm font-semibold text-gray-800 mb-2">Q: {q.question_text}</p>

              {/* Existing answer */}
              {q.answer_text && (
                <p className="text-sm text-gray-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  A: {q.answer_text}
                </p>
              )}

              {/* Answer form (unanswered only) */}
              {!q.answer_text && (
                answeringId === q.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Type your answer…"
                      rows={3}
                      className={INPUT + ' resize-none'}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAnswer(q)}
                        disabled={submitting || !answerText.trim()}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition"
                      >
                        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Post Answer
                      </button>
                      <button
                        onClick={() => { setAnsweringId(null); setAnswerText('') }}
                        className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAnsweringId(q.id); setAnswerText('') }}
                    className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition"
                  >
                    Write answer →
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
