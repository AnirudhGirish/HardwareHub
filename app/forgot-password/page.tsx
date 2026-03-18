'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
          <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Reset password</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white border border-[#E5E5E5] rounded-lg p-8">
          {sent ? (
            <div className="text-center">
              <Mail className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="font-medium text-[#0A0A0A]">Check your email</p>
              <p className="text-sm text-[#6B6B6B] mt-2">
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-[#FEF2F2] border border-red-200 px-4 py-3">
                  <p className="text-sm text-[#991B1B]">{error}</p>
                </div>
              )}
              <Input
                label="Email"
                type="email"
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@mbrdi.mercedes-benz.com"
              />
              <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-[#6B6B6B]">
          <Link href="/login" className="font-medium text-[#0A0A0A] hover:underline">Back to sign in</Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  )
}
