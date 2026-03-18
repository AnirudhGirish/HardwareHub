import Link from 'next/link'
import type { Metadata } from 'next'
import { ToastContainer } from '@/components/ui/Toast'
import { Lock } from 'lucide-react'

export const metadata: Metadata = { title: '403 — Forbidden' }

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="text-center max-w-sm flex flex-col items-center">
        <Lock className="w-16 h-16 text-zinc-300 mb-6" />
        <h1 className="text-2xl font-semibold text-[#0A0A0A] mb-2">Access denied</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center h-10 px-5 rounded-md bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
      <ToastContainer />
    </div>
  )
}
