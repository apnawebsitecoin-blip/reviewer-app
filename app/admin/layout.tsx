import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import AdminNav from '@/components/AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  return (
    /* Full-bleed gray bg for the admin area */
    <div className="-mx-4 sm:-mx-6 bg-gray-50 px-4 sm:px-6 py-8 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-52 flex-shrink-0 sticky top-20">
          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.07)] p-4">
            {/* Sidebar brand */}
            <div className="flex items-center gap-2.5 mb-5 px-1">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-extrabold text-gray-900 tracking-tight">Admin Panel</span>
            </div>

            <AdminNav />
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
