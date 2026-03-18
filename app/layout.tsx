import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Hardware Hub — MBRDI',
    template: '%s | Hardware Hub',
  },
  description:
    'Internal hardware and licence management tool for Mercedes-Benz Research and Development India.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[var(--font-inter)] bg-white text-[#0A0A0A] antialiased">
        {children}
      </body>
    </html>
  )
}
