import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import LoginForm from '@/components/forms/LoginForm'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-4">
            <div className="h-9 w-9 rounded-md bg-[#1A1A1A] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" />
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Sign in to Hardware Hub</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">MBRDI internal platform</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-lg p-8">
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center mt-6 text-sm text-[#6B6B6B]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-[#0A0A0A] hover:underline">
            Register
          </Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  )
}
