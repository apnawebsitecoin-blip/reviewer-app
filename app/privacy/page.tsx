export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p><strong>1. Data Collected:</strong> We collect your name, email, phone number, UPI ID, PAN number, and purchase invoices to verify reviews and process payouts.</p>
        <p><strong>2. How We Use It:</strong> Your data is used to verify product purchases, calculate affiliate commissions, and process withdrawals. We do not sell your data to third parties.</p>
        <p><strong>3. Affiliate Tracking:</strong> We track clicks via unique affiliate links to attribute commissions to reviewers. Click data includes timestamp and approximate location (IP-based).</p>
        <p><strong>4. Cookies:</strong> We use session cookies for authentication. No third-party advertising cookies are used.</p>
        <p><strong>5. Data Storage:</strong> All data is stored securely on Supabase (PostgreSQL) with row-level security. Uploaded files are stored in Supabase Storage.</p>
        <p><strong>6. Your Rights:</strong> You may request deletion of your account and associated data by contacting us. Wallet balance will be paid out before deletion if above ₹100.</p>
        <p><strong>7. Security:</strong> We use industry-standard encryption for data in transit and at rest. Passwords are hashed by Supabase Auth (bcrypt).</p>
        <p className="text-xs text-gray-400 mt-6">Last updated: August 2026. This is a template — have a lawyer review before launch.</p>
      </div>
    </div>
  )
}
