import { getSiteSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const DEFAULT_PRIVACY = `1. Data Collected: We collect your name, email, phone number, UPI ID, PAN number, and purchase invoices to verify reviews and process payouts.

2. How We Use It: Your data is used to verify product purchases, calculate affiliate commissions, and process withdrawals. We do not sell your data to third parties.

3. Affiliate Tracking: We track clicks via unique affiliate links to attribute commissions to reviewers. Click data includes timestamp and approximate location (IP-based).

4. Cookies: We use session cookies for authentication. No third-party advertising cookies are used.

5. Data Storage: All data is stored securely on Supabase (PostgreSQL) with row-level security. Uploaded files are stored in Supabase Storage.

6. Your Rights: You may request deletion of your account and associated data by contacting us. Wallet balance will be paid out before deletion if above ₹100.

7. Security: We use industry-standard encryption for data in transit and at rest. Passwords are hashed by Supabase Auth (bcrypt).`

export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  const content = settings.privacyContent?.trim() || DEFAULT_PRIVACY

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8 my-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Privacy Policy</h1>
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
