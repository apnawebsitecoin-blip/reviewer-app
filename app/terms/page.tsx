import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const DEFAULT_TERMS = `1. Eligibility: You must have purchased the product to submit a review. False reviews will result in account suspension.

2. Affiliate Disclosure: Product links on this platform may be affiliate links. We earn a commission when you purchase via these links at no extra cost to you.

3. Commission Split: Reviewers receive 60% of affiliate commission generated through their unique review links. Platform retains 40%.

4. Withdrawal: Minimum wallet balance of ₹100 is required for withdrawal. PAN number is required for KYC verification before first withdrawal.

5. Fraud Prevention: Any attempt to manipulate clicks, submit duplicate invoices, or self-click affiliate links will result in immediate account suspension and forfeiture of wallet balance.

6. Content Policy: Reviews must be honest and based on personal experience. ReviewApp reserves the right to remove reviews that violate community guidelines.

7. Limitation of Liability: ReviewApp is not responsible for the quality of products listed. We only verify that the reviewer has purchased the product.

8. Changes: These terms may be updated at any time. Continued use of the platform constitutes acceptance of updated terms.`

export default async function TermsPage() {
  const supabase = await createClient()
  let content = ''

  // content_pages table: prefer dedicated row over site_settings.termsContent
  try {
    const { data: page } = await supabase
      .from('content_pages')
      .select('body')
      .eq('slug', 'terms')
      .eq('is_published', true)
      .maybeSingle()

    if (page?.body?.trim()) content = page.body
  } catch { /* table may not exist yet */ }

  // Fall back to site_settings.termsContent, then hardcoded default
  if (!content) {
    const settings = await getSiteSettings()
    content = settings.termsContent?.trim() || DEFAULT_TERMS
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8 my-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Terms &amp; Conditions</h1>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        {content.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
        <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          Last updated: August 2026 · Admin → Site Settings → Legal & FAQ se content update karo
        </p>
      </div>
    </div>
  )
}
