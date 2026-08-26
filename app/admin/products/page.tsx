import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import AddProductForm from './AddProductForm'
import ProductActions from './ProductActions'
import BulkUpload from './BulkUpload'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const list = products ?? []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your product catalog</p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-bold px-3 py-1 rounded-full">
          {list.length} products
        </span>
      </div>

      {/* Bulk upload */}
      <BulkUpload />

      {/* Single add */}
      <AddProductForm />

      {/* Product list */}
      <div className="mt-5">
        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-12 text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-indigo-300" />
            </div>
            <p className="text-sm text-gray-400">Abhi koi product nahi — ऊपर add karo</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                            }
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-semibold text-gray-900 line-clamp-1 max-w-[200px]">{p.name}</p>
                            {p.is_featured && <span title="Featured" className="text-yellow-500 shrink-0">⭐</span>}
                            {p.is_sponsored && <span title="Sponsored" className="text-amber-500 shrink-0">🚀</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.category ? (
                          <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {p.category}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {p.price ? formatCurrency(p.price) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.platform ? (
                          <span className="capitalize text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                            {p.platform}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <ProductActions
                          productId={p.id}
                          isFeatured={p.is_featured ?? false}
                          isSponsored={p.is_sponsored ?? false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
