import { getSiteSettings } from '@/lib/settings'
import { HelpCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FaqPage() {
  const settings = await getSiteSettings()
  const faqs = settings.faqItems ?? []

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex items-center gap-3 mb-8">
        <HelpCircle className="w-7 h-7 text-indigo-500" />
        <h1 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h1>
      </div>

      {faqs.length === 0 ? (
        <p className="text-gray-400 text-center py-16">FAQ abhi add nahi kiye gaye. Admin → Site Settings → Legal & FAQ mein add karo.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-semibold text-gray-800 text-sm hover:bg-gray-50 transition-colors">
                {faq.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none ml-3 shrink-0">›</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                <p className="pt-3">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
