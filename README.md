# ReviewApp — Verified Reviewer Affiliate Platform

एक ऐसा प्लेटफॉर्म जहाँ सिर्फ verified खरीदार रिव्यू दे सकते हैं, और हर रिव्यू से affiliate commission कमा सकते हैं।

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS
- **Backend + DB + Auth**: Supabase (Postgres, Auth, Storage)
- **Charts**: Recharts (donut chart)
- **Icons**: Lucide React
- **i18n**: react-i18next (Hindi + English)

## Features

- ✅ Verified buyer reviews (invoice upload + SHA-256 duplicate detection)
- ✅ Sentiment donut chart (positive / neutral / negative)
- ✅ Affiliate click tracking with IP rate-limiting & self-click prevention
- ✅ 60% reviewer / 40% platform commission split
- ✅ Reviewer dashboard (wallet, trust score, clicks, earnings)
- ✅ Admin panel (review moderation, product management, commission management, user management)
- ✅ Leaderboard, Compare, Collections, Q&A, Price Alerts
- ✅ WhatsApp share + Referral system (₹20 bonus)
- ✅ Hindi / English language toggle
- ✅ Mobile-responsive UI

## Setup

### 1. Supabase Project बनाएं

1. [supabase.com](https://supabase.com) पर जाएं → New Project बनाएं
2. **Dashboard → SQL Editor** में `supabase-schema.sql` का पूरा content paste करके Run करें
3. **Dashboard → Storage → New Bucket** → Name: `review-media`, Public: ON
4. **Dashboard → Authentication → Providers → Email** → "Confirm email" OFF करें

### 2. API Keys लें

**Supabase Dashboard → Settings → API** से तीनों keys copy करें:

```bash
cp .env.local.example .env.local
```

`.env.local` में भरें:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_AFFILIATE_TAG=YOURAPP-21
```

### 3. Admin Account बनाएं

Signup करने के बाद Supabase SQL Editor में:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'your-user-uuid';
```

### 4. Run करें

```bash
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## Database Schema

Full schema: `supabase-schema.sql`

Key tables:
| Table | Purpose |
|---|---|
| `profiles` | User profiles (extends Supabase auth) |
| `products` | Product catalog |
| `reviews` | Verified buyer reviews |
| `clicks` | Affiliate click tracking |
| `commissions` | Commission records (manual for MVP) |
| `notifications` | In-app notifications |
| `questions` | Product Q&A |
| `price_alerts` | Price drop alert subscriptions |
| `collections` | Curated product collections |

## Commission Split

| Party | Share |
|---|---|
| Reviewer | 60% of affiliate commission |
| Platform | 40% |
| Buyer cashback | ~10% of total (optional) |

## Deployment (Vercel)

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. Environment variables add करें (same as `.env.local`)
3. Deploy → Done!

## Future Roadmap

- [ ] Real affiliate network integration (Cuelinks / Admitad)
- [ ] Automatic product feed import (cron)
- [ ] AI fraud detection (invoice OCR)
- [ ] Real UPI payout automation (Razorpay/Cashfree)
- [ ] Push notifications (email/SMS/WhatsApp)
- [ ] Advanced reviewer analytics

## SQL Fix Files

| File | Purpose |
|---|---|
| `supabase-schema.sql` | Full DB schema (run first) |
| `fix-trigger.sql` | Trigger fix (if signup fails) |
| `fix-signup-v2.sql` | RLS policy fix + INSERT policy |
