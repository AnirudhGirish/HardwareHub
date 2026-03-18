'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/schemas/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'

type PageState = 'loading' | 'invalid' | 'form' | 'success'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [serverError, setServerError] = useState<string | null>(null)
  const supabase = createClient()
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    /**
     * Supabase sends a PKCE reset link. When the user clicks the link,
     * Supabase exchanges the token in the URL hash/params and sets an
     * authenticated session. We just need to verify one exists.
     *
     * The URL will contain either:
     *   ?token_hash=...&type=recovery  (PKCE flow, email OTP)
     * or
     *   #access_token=...  (implicit flow — legacy)
     *
     * onAuthStateChange fires with SIGNED_IN / PASSWORD_RECOVERY when Supabase
     * SDK handles the hash automatically.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('form')
      }
    })

    // Also check immediately in case session is already established
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('form')
      } else {
        // If no auth event fires within 3s, treat link as invalid
        const timer = setTimeout(() => {
          setPageState((prev) => (prev === 'loading' ? 'invalid' : prev))
        }, 3000)
        return () => clearTimeout(timer)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: ResetPasswordInput) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setServerError(error.message)
      return
    }
    setPageState('success')
    redirectTimerRef.current = setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  const logoBlock = (
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
      <h1 className="text-2xl font-semibold tracking-tight text-[#0A0A0A]">Set new password</h1>
      <p className="mt-1 text-sm text-[#6B6B6B]">Choose a strong password for your account</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {pageState === 'loading' && (
          <div className="text-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#1A1A1A] border-t-transparent" />
            <p className="mt-3 text-sm text-[#6B6B6B]">Verifying your link…</p>
          </div>
        )}

        {pageState === 'invalid' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {logoBlock}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 6v4m0 4h.01M19 10A9 9 0 111 10a9 9 0 0118 0z" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-medium text-[#0A0A0A]">Invalid or expired link</p>
              <p className="text-sm text-[#6B6B6B] mt-2">
                This password reset link has expired or is invalid.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block text-sm font-medium text-[#0A0A0A] hover:underline"
              >
                Request a new reset link →
              </Link>
            </div>
          </motion.div>
        )}

        {pageState === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {logoBlock}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-8">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                {serverError && (
                  <div className="rounded-md bg-[#FEF2F2] border border-red-200 px-4 py-3">
                    <p className="text-sm text-[#991B1B]">{serverError}</p>
                  </div>
                )}
                <Input
                  label="New password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  hint="Minimum 8 characters"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  id="confirm_password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirm_password')}
                  error={errors.confirm_password?.message}
                />
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Set new password
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {pageState === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {logoBlock}
            <div className="bg-white border border-[#E5E5E5] rounded-lg p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M7 10l2.5 2.5L13 7" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="10" r="9" stroke="#059669" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="font-medium text-[#0A0A0A]">Password updated</p>
              <p className="text-sm text-[#6B6B6B] mt-2">
                Your password has been changed. Redirecting you to sign in…
              </p>
            </div>
          </motion.div>
        )}

        <p className="text-center mt-6 text-sm text-[#6B6B6B]">
          <Link href="/login" className="font-medium text-[#0A0A0A] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
      <ToastContainer />
    </div>
  )
}
