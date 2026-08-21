'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle } from 'lucide-react'
import type { Question } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

interface Props {
  productId: string
  user: User | null
}

export default function QASection({ productId, user }: Props) {
  const supabase = createClient()
  const [questions, setQuestions] = useState<Question[]>([])
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')

  useEffect(() => {
    supabase.from('questions').select('*, profiles(id, name)').eq('product_id', productId)
      .order('created_at', { ascending: false }).then(({ data }) => setQuestions(data ?? []))
  }, [productId])

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !question.trim()) return
    setSubmitting(true)
    const { data } = await supabase.from('questions').insert({ product_id: productId, asked_by: user.id, question_text: question }).select('*, profiles(id, name)').single()
    if (data) setQuestions(prev => [data, ...prev])
    setQuestion('')
    setSubmitting(false)
  }

  const handleAnswer = async (qId: string) => {
    if (!user || !answerText.trim()) return
    const q = questions.find(q => q.id === qId)
    await supabase.from('questions').update({ answer_text: answerText, answered_by: user.id }).eq('id', qId)
    // Notify the question asker
    if (q && q.asked_by !== user.id) {
      await supabase.from('notifications').insert({
        user_id: q.asked_by,
        message: `आपके सवाल का जवाब मिल गया! "${q.question_text.substring(0, 40)}..."`,
      })
    }
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, answer_text: answerText, answered_by: user.id } : q))
    setAnsweringId(null)
    setAnswerText('')
  }

  return (
    <div className="bg-white rounded-2xl shadow mt-4 p-6">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-indigo-500" />Reviewer से पूछें
      </h3>

      {user ? (
        <form onSubmit={handleAsk} className="flex gap-2 mb-4">
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="अपना सवाल लिखें..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={submitting || !question.trim()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? '...' : 'पूछें'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-400 mb-4">सवाल पूछने के लिए <a href="/auth/login" className="text-indigo-600 hover:underline">लॉगिन करें</a></p>
      )}

      <div className="space-y-3">
        {questions.map(q => (
          <div key={q.id} className="border rounded-xl p-3">
            <p className="text-sm font-medium text-gray-700">Q: {q.question_text}</p>
            <p className="text-xs text-gray-400 mb-2">— {(q as any).profiles?.name ?? 'User'}</p>
            {q.answer_text ? (
              <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-2 mt-2">A: {q.answer_text}</p>
            ) : user ? (
              answeringId === q.id ? (
                <div className="flex gap-2 mt-2">
                  <input value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="जवाब लिखें..."
                    className="flex-1 border rounded-lg px-2 py-1 text-sm focus:outline-none" />
                  <button onClick={() => handleAnswer(q.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs">भेजें</button>
                  <button onClick={() => setAnsweringId(null)} className="text-gray-400 text-xs">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAnsweringId(q.id)} className="text-xs text-indigo-500 hover:underline mt-1">जवाब दें</button>
              )
            ) : (
              <p className="text-xs text-gray-400 mt-1 italic">अभी जवाब नहीं आया</p>
            )}
          </div>
        ))}
        {questions.length === 0 && <p className="text-sm text-gray-400">अभी कोई सवाल नहीं। पहले सवाल पूछें!</p>}
      </div>
    </div>
  )
}
