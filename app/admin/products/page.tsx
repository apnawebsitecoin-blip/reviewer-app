import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import AddProductForm from './AddProductForm'
import ProductActions from './ProductActions'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Products ({(products ?? []).length})</h1>
      </div>

      <AddProductForm />

      <div className="mt-6 space-y-3">
        {(products ?? []).map(p => (
          <div key={p.id} className="bg-white rounded-xl shadow p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span>{p.category}</span>
                <span>{formatCurrency(p.price ?? 0)}</span>
                <span className="capitalize">{p.platform}</span>
              </div>
            </div>
            <ProductActions productId={p.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
