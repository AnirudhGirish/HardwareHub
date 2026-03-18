import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import RegisterForm from '@/components/forms/RegisterForm'
import { ToastContainer } from '@/components/ui/Toast'

export const metadata: Metadata = { title: 'Register' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Create your account</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">MBRDI email required</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] rounded-lg p-8">
          <Suspense fallback={<div className="h-96" />}>
            <RegisterForm />
          </Suspense>
        </div>
        <p className="text-center mt-6 text-sm text-[#6B6B6B]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#0A0A0A] hover:underline">Sign in</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  )
}
