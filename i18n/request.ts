import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const SUPPORTED = ['en', 'hi'] as const
type Locale = typeof SUPPORTED[number]

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? ''
  const locale: Locale = (SUPPORTED as readonly string[]).includes(raw) ? (raw as Locale) : 'hi'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
