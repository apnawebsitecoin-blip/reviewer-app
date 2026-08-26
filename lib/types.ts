export type Sentiment = 'positive' | 'neutral' | 'negative'
export type CommissionStatus = 'pending' | 'confirmed' | 'paid'

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  upi_id: string | null
  pan_number: string | null
  trust_score: number
  wallet_balance: number
  is_admin: boolean
  is_blocked: boolean
  referred_by: string | null
  referral_code: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  image_url: string | null
  price: number | null
  platform: string | null
  original_url: string
  category: string | null
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  reviewer_id: string
  sentiment: Sentiment
  review_text: string | null
  invoice_url: string | null
  media_url: string | null
  invoice_hash: string | null
  duplicate_flag: boolean
  verified: boolean
  later_returned: boolean
  detailed_badge: boolean
  created_at: string
  profiles?: Pick<Profile, 'id' | 'name' | 'trust_score'>
  products?: Pick<Product, 'id' | 'name'>
}

export interface Click {
  id: string
  product_id: string
  reviewer_id: string
  ip_address: string | null
  clicked_at: string
}

export interface Commission {
  id: string
  click_id: string
  reviewer_id: string
  sale_amount: number
  total_commission: number
  reviewer_share: number
  platform_share: number
  buyer_share: number
  status: CommissionStatus
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
}

export interface Question {
  id: string
  product_id: string
  asked_by: string
  question_text: string
  answer_text: string | null
  answered_by: string | null
  created_at: string
  profiles?: Pick<Profile, 'id' | 'name'>
}

export interface PriceAlert {
  id: string
  user_id: string
  product_id: string
  target_price: number
  created_at: string
}

export interface Collection {
  id: string
  title: string
  product_ids: string[]
  created_at: string
}

export interface VideoReview {
  id: string
  product_id: string
  reviewer_id: string
  youtube_video_id: string
  title: string
  description: string | null
  status: 'processing' | 'live' | 'failed' | 'deleted'
  created_at: string
  profiles?: { name: string | null }
  products?: { name: string }
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  status: WithdrawalStatus
  upi_id: string | null
  pan_number: string | null
  bank_account: string | null
  bank_ifsc: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'id' | 'name'>
}

export interface DailyCheckin {
  id: string
  user_id: string
  checked_in_at: string
  reward_amount: number
}

export interface Wishlist {
  id: string
  user_id: string
  product_id: string
  created_at: string
  products?: Product
}

export interface Coupon {
  id: string
  code: string
  title: string
  discount_type: 'percent' | 'flat'
  discount_value: number
  product_id: string | null
  category: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}
