'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const [serverError, setServerError] = useState<string | null>(
    errorParam === 'deactivated' ? 'Your account has been deactivated. Contact your administrator.' : null
  )

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setServerError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setServerError('Email or password is incorrect. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setServerError('Please confirm your email before signing in.')
      } else {
        setServerError(error.message)
      }
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-[#FEF2F2] border border-red-200 px-4 py-3">
          <p className="text-sm text-[#991B1B]">{serverError}</p>
        </div>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        id="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="you@mbrdi.mercedes-benz.com"
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        id="password"
        {...register('password')}
        error={errors.password?.message}
        placeholder="••••••••"
      />
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-sm text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  )
}
