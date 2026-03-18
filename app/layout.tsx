import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import './globals.css'

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}