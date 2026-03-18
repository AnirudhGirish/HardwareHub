import Link from 'next/link'
import type { Metadata } from 'next'
import { FileQuestion } from 'lucide-react'
import { ToastContainer } from '@/components/ui/Toast'
import { Navbar } from '@/components/layout/Navbar'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      <Navbar />
      <div className="flex flex-col items-center justify-center mt-32 p-4 text-center">
        <div className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-semibold text-[#0A0A0A] mb-2">URL not found</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
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
