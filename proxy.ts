import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// In-process cache so we don't query app_settings on every single request.
// Refreshed every 30 s. Serverless cold-starts will re-fetch, which is fine.
let maintenanceCachedUntil = 0
let maintenanceEnabled = false

async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now()
  if (now < maintenanceCachedUntil) return maintenanceEnabled

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/app_settings?key=eq.maintenance_mode&select=value&limit=1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      }
    )
    if (res.ok) {
      const data = await res.json()
      maintenanceEnabled = Array.isArray(data) && data[0]?.value === 'true'
    }
  } catch { /* fail open — if Supabase is unreachable don't block the site */ }

  maintenanceCachedUntil = now + 30_000
  return maintenanceEnabled
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard and /admin routes — redirect unauthenticated users to login
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Maintenance mode: redirect public routes to /offline
  // Admin and auth routes are always accessible so admins can fix things.
  const isPublicRoute =
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/api') &&
    pathname !== '/offline'

  if (isPublicRoute && await isMaintenanceMode()) {
    return NextResponse.redirect(new URL('/offline', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)',
  ],
}
