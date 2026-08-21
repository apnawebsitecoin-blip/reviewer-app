import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReviewApp – Verified Reviews',
  description: 'Real reviews from verified buyers. Earn commission by sharing honest reviews.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <footer className="border-t mt-12 py-6 text-center text-sm text-gray-400">
            <div className="flex justify-center gap-4 mb-2">
              <a href="/terms" className="hover:underline">Terms</a>
              <a href="/privacy" className="hover:underline">Privacy</a>
            </div>
            © 2026 ReviewApp. All rights reserved.
          </footer>
        </Providers>
      </body>
    </html>
  )
}
